import { scoreExam, type ScoringAnswer, type ScoringQuestion } from "@/features/scoring/score";
import { prisma } from "@/lib/prisma";

import { advanceTimeline, type Timeline } from "./engine";

// Siklus hidup percobaan tryout di server (I.4): jadwal subtes, pengumpulan idempoten,
// dan penilaian (J.1). Dipakai server action dan halaman ujian; tidak diekspor ke client.

export const attemptCoreSelect = {
  id: true,
  userId: true,
  examId: true,
  status: true,
  seed: true,
  startedAt: true,
  deadlineAt: true,
  submittedAt: true,
  currentQuestionId: true,
  exam: {
    select: {
      id: true,
      slug: true,
      title: true,
      durationMin: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      correctScore: true,
      wrongScore: true,
      passingGrade: true,
      sections: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true, durationMin: true, weight: true, passingGrade: true } },
    },
  },
  sections: { select: { sectionId: true, startedAt: true, deadlineAt: true, submittedAt: true } },
} as const;

export async function loadAttempt(attemptId: string) {
  return prisma.examAttempt.findUnique({ where: { id: attemptId }, select: attemptCoreSelect });
}

export type AttemptCore = NonNullable<Awaited<ReturnType<typeof loadAttempt>>>;

/** Jadwal subtes menurut data tersimpan, dimajukan sampai `now`. */
export function timelineOf(attempt: AttemptCore, now: Date): Timeline {
  const rows = new Map(attempt.sections.map((s) => [s.sectionId, s]));
  const sections = attempt.exam.sections.map((s) => {
    const row = rows.get(s.id);
    return {
      sectionId: s.id,
      durationMin: s.durationMin,
      startedAt: row?.startedAt ?? null,
      deadlineAt: row?.deadlineAt ?? null,
      submittedAt: row?.submittedAt ?? null,
    };
  });
  return advanceTimeline(sections, attempt.startedAt, attempt.deadlineAt, now);
}

export async function saveTimeline(attemptId: string, timeline: Timeline) {
  if (!timeline.changed || timeline.mode === "bebas") return;
  await prisma.$transaction(
    timeline.sections.map((s) =>
      prisma.examAttemptSection.upsert({
        where: { attemptId_sectionId: { attemptId, sectionId: s.sectionId } },
        create: { attemptId, sectionId: s.sectionId, startedAt: s.startedAt, deadlineAt: s.deadlineAt, submittedAt: s.submittedAt },
        update: { startedAt: s.startedAt, deadlineAt: s.deadlineAt, submittedAt: s.submittedAt },
      }),
    ),
  );
}

/**
 * Kumpulkan dan nilai satu percobaan. Idempoten: status diubah dari BERLANGSUNG ke SELESAI
 * dengan updateMany bersyarat di dalam transaksi, sehingga pengiriman ganda (tombol ditekan
 * dua kali, auto-submit bersamaan dengan submit manual) hanya menilai sekali (I.4.9).
 */
export async function finalizeAttempt(attemptId: string, opts: { auto: boolean; now?: Date }) {
  const now = opts.now ?? new Date();
  const attempt = await loadAttempt(attemptId);
  if (!attempt) return { finalized: false } as const;
  if (attempt.status !== "BERLANGSUNG") return { finalized: false } as const;

  const submittedAt = now > attempt.deadlineAt ? attempt.deadlineAt : now;
  const timeline = timelineOf(attempt, submittedAt);
  const closedSections = timeline.sections.map((s) => ({
    ...s,
    startedAt: s.startedAt ?? (timeline.mode === "berurutan" ? submittedAt : null),
    deadlineAt: s.deadlineAt ?? (timeline.mode === "berurutan" ? submittedAt : null),
    submittedAt: s.submittedAt ?? submittedAt,
  }));

  const [examQuestions, answers] = await Promise.all([
    prisma.examQuestion.findMany({
      where: { examId: attempt.examId },
      orderBy: [{ section: { order: "asc" } }, { order: "asc" }],
      select: {
        sectionId: true,
        weight: true,
        question: {
          select: {
            id: true,
            type: true,
            topic: true,
            difficulty: true,
            weight: true,
            correctText: true,
            correctNumber: true,
            tolerance: true,
            options: { select: { id: true, isCorrect: true, score: true } },
          },
        },
      },
    }),
    prisma.examAnswer.findMany({ where: { attemptId } }),
  ]);

  const scoringQuestions: ScoringQuestion[] = examQuestions.map(({ sectionId, weight, question: q }) => ({
    id: q.id,
    sectionId,
    type: q.type,
    topic: q.topic,
    difficulty: q.difficulty,
    weight: weight ?? q.weight,
    options: q.options,
    correctText: q.correctText,
    correctNumber: q.correctNumber,
    tolerance: q.tolerance,
  }));
  const answerMap: Record<string, ScoringAnswer> = {};
  for (const a of answers) {
    answerMap[a.questionId] = {
      optionIds: Array.isArray(a.optionIds) ? (a.optionIds as string[]) : null,
      textAnswer: a.textAnswer,
      numberAnswer: a.numberAnswer,
      timeSpentSec: a.timeSpentSec,
      gradedScore: a.gradedById ? a.score : null,
    };
  }
  const score = scoreExam(scoringQuestions, answerMap, {
    correctScore: attempt.exam.correctScore,
    wrongScore: attempt.exam.wrongScore,
    passingGrade: attempt.exam.passingGrade,
    sections: attempt.exam.sections.map((s) => ({ id: s.id, weight: s.weight, passingGrade: s.passingGrade })),
  });

  const finalized = await prisma.$transaction(async (tx) => {
    const claimed = await tx.examAttempt.updateMany({
      where: { id: attemptId, status: "BERLANGSUNG" },
      data: { status: "SELESAI", submittedAt },
    });
    if (claimed.count === 0) return false;

    for (const s of closedSections) {
      await tx.examAttemptSection.upsert({
        where: { attemptId_sectionId: { attemptId, sectionId: s.sectionId } },
        create: { attemptId, sectionId: s.sectionId, startedAt: s.startedAt, deadlineAt: s.deadlineAt, submittedAt: s.submittedAt },
        update: { startedAt: s.startedAt, deadlineAt: s.deadlineAt, submittedAt: s.submittedAt },
      });
    }
    for (const r of score.questions) {
      const isCorrect = r.status === "BENAR" ? true : r.status === "SALAH" ? false : null;
      const scoreValue = r.status === "MENUNGGU_PENILAIAN" ? null : r.score;
      await tx.examAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: r.questionId } },
        create: { attemptId, questionId: r.questionId, isCorrect, score: scoreValue },
        update: { isCorrect, score: scoreValue },
      });
    }
    await tx.examResult.create({
      data: {
        attemptId,
        totalScore: score.totalScore,
        maxScore: score.maxScore,
        correct: score.correct,
        wrong: score.wrong,
        empty: score.empty,
        durationSec: Math.max(0, Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)),
        passed: score.passed,
        sections: { create: score.sections.map((s) => ({ ...s })) },
        topics: { create: score.topics },
      },
    });
    await tx.examActivityLog.create({ data: { attemptId, type: opts.auto ? "AUTO_SUBMIT" : "SUBMIT", at: now } });
    await tx.notification.create({
      data: {
        userId: attempt.userId,
        type: "TRYOUT",
        title: "Hasil tryout tersedia",
        body: `Nilai ${attempt.exam.title} sudah bisa dilihat${score.pending ? "; soal essay masih menunggu penilaian admin" : ""}.`,
        href: "/dashboard/riwayat", // TODO batch B: /tryout/hasil/${attemptId}
      },
    });
    return true;
  });
  return { finalized } as const;
}

/**
 * Pastikan keadaan percobaan mutakhir saat diakses: subtes yang lewat waktu ditutup, dan
 * percobaan yang seluruh waktunya habis dikumpulkan otomatis (CLAUDE.md "Submit idempoten").
 */
export async function syncAttempt(attempt: AttemptCore, now = new Date()) {
  if (attempt.status !== "BERLANGSUNG") return { attempt, timeline: null, finished: true } as const;
  const timeline = timelineOf(attempt, now);
  if (timeline.activeIndex < 0 || now >= attempt.deadlineAt) {
    await finalizeAttempt(attempt.id, { auto: true, now });
    return { attempt, timeline: null, finished: true } as const;
  }
  await saveTimeline(attempt.id, timeline);
  return { attempt, timeline, finished: false } as const;
}
