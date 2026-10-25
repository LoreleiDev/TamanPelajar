// Hasil dan pembahasan tryout (I.6, I.7, J.2). Hanya pemilik percobaan (atau admin) yang
// bisa membaca. Kunci jawaban dan pembahasan baru dikirim setelah percobaan selesai dan
// waktu buka pembahasan tiba (M.6.5).

import { imageUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";

import { loadAttempt, syncAttempt } from "./attempt";
import { optionLabel, orderForAttempt, rankAmong } from "./engine";
import { getUserExamStates } from "./queries";

type Viewer = { id: string; role: string };

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (score: number, max: number) => (max > 0 ? round1((score / max) * 100) : 0);

function discussionGate(exam: { showDiscussion: boolean; discussionOpensAt: Date | null }, now = new Date()) {
  if (!exam.showDiscussion) return { open: false, opensAt: null } as const;
  if (exam.discussionOpensAt && exam.discussionOpensAt > now) return { open: false, opensAt: exam.discussionOpensAt } as const;
  return { open: true, opensAt: null } as const;
}

/** Percobaan milik penampil; percobaan yang waktunya habis dikumpulkan lebih dulu. */
async function ownedFinishedAttempt(attemptId: string, viewer: Viewer) {
  const core = await loadAttempt(attemptId);
  if (!core || (core.userId !== viewer.id && viewer.role !== "ADMIN")) return { kind: "tidak-ada" } as const;
  if (core.status === "BERLANGSUNG") {
    const synced = await syncAttempt(core);
    if (!synced.finished) return { kind: "berlangsung" } as const;
  }
  return { kind: "selesai", core } as const;
}

export async function getAttemptResult(attemptId: string, viewer: Viewer) {
  const owned = await ownedFinishedAttempt(attemptId, viewer);
  if (owned.kind !== "selesai") return owned;

  const attempt = await prisma.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      attemptNo: true,
      startedAt: true,
      submittedAt: true,
      exam: {
        select: {
          id: true,
          slug: true,
          title: true,
          passingGrade: true,
          maxAttempts: true,
          showDiscussion: true,
          discussionOpensAt: true,
          sections: { orderBy: { order: "asc" }, select: { id: true, title: true, passingGrade: true } },
        },
      },
      result: {
        select: {
          totalScore: true,
          maxScore: true,
          correct: true,
          wrong: true,
          empty: true,
          durationSec: true,
          passed: true,
          sections: { select: { sectionId: true, score: true, maxScore: true, correct: true, wrong: true, empty: true, passed: true } },
          topics: { select: { topic: true, correct: true, total: true, mastery: true, avgTimeSec: true } },
        },
      },
      answers: {
        select: {
          isCorrect: true,
          textAnswer: true,
          timeSpentSec: true,
          question: { select: { type: true, topic: true, subject: true, difficulty: true } },
        },
      },
    },
  });
  const result = attempt.result;
  if (!result) return { kind: "tidak-ada" } as const;
  const exam = attempt.exam;

  // Nilai terbaik per peserta lain, untuk peringkat dan rata-rata.
  const others = await prisma.examAttempt.findMany({
    where: { examId: exam.id, status: "SELESAI", userId: { not: attempt.userId }, result: { isNot: null } },
    select: { userId: true, result: { select: { totalScore: true, topics: { select: { topic: true, mastery: true } } } } },
  });
  const bestByUser = new Map<string, number>();
  const topicTotals = new Map<string, { sum: number; n: number }>();
  for (const o of others) {
    bestByUser.set(o.userId, Math.max(bestByUser.get(o.userId) ?? -Infinity, o.result!.totalScore));
    for (const t of o.result!.topics) {
      const agg = topicTotals.get(t.topic) ?? { sum: 0, n: 0 };
      topicTotals.set(t.topic, { sum: agg.sum + t.mastery, n: agg.n + 1 });
    }
  }
  const ranking = rankAmong(result.totalScore, [...bestByUser.values()]);

  const subjectOf = new Map(attempt.answers.map((a) => [a.question.topic, a.question.subject]));
  const topics = result.topics
    .map((t) => {
      const agg = topicTotals.get(t.topic);
      return { ...t, subject: subjectOf.get(t.topic) ?? "", average: agg ? round1(agg.sum / agg.n) : null };
    })
    .sort((a, b) => a.mastery - b.mastery);

  // Rincian tingkat kesulitan dan kecepatan (J.2.3–J.2.5).
  const difficulty = (["MUDAH", "SEDANG", "SULIT"] as const)
    .map((d) => {
      const items = attempt.answers.filter((a) => a.question.difficulty === d);
      return {
        difficulty: d,
        total: items.length,
        correct: items.filter((a) => a.isCorrect === true).length,
        avgTimeSec: items.length ? Math.round(items.reduce((n, a) => n + a.timeSpentSec, 0) / items.length) : 0,
      };
    })
    .filter((d) => d.total > 0);
  const pendingEssays = attempt.answers.filter((a) => a.question.type === "ESSAY" && a.isCorrect === null && a.textAnswer?.trim()).length;
  const questionCount = await prisma.examQuestion.count({ where: { examId: exam.id } });

  // Rekomendasi (I.6.9, J.2.8): topik di bawah 70%, ditautkan ke kelas mata pelajarannya.
  const weak = topics.filter((t) => t.mastery < 70).slice(0, 4);
  const courses = weak.length
    ? await prisma.course.findMany({
        where: { subject: { in: [...new Set(weak.map((t) => t.subject))] }, status: "TERBIT", deletedAt: null },
        select: { slug: true, title: true, subject: true },
      })
    : [];
  const recommendations = weak.map((t) => ({
    topic: t.topic,
    subject: t.subject,
    mastery: t.mastery,
    course: courses.find((c) => c.subject === t.subject) ?? null,
  }));

  const state = attempt.userId === viewer.id ? (await getUserExamStates(viewer, [exam.slug])).get(exam.slug) : undefined;
  const sectionResults = new Map(result.sections.map((s) => [s.sectionId, s]));

  return {
    kind: "selesai",
    attemptId: attempt.id,
    attemptNo: attempt.attemptNo,
    submittedAt: attempt.submittedAt ?? attempt.startedAt,
    exam: { slug: exam.slug, title: exam.title, passingGrade: exam.passingGrade, maxAttempts: exam.maxAttempts },
    total: { ...result, percent: pct(result.totalScore, result.maxScore), pending: pendingEssays, questionCount },
    avgTimePerQuestionSec: questionCount ? Math.round(result.durationSec / questionCount) : 0,
    sections: exam.sections.map((s) => {
      const r = sectionResults.get(s.id);
      return { id: s.id, title: s.title, passingGrade: s.passingGrade, ...(r ?? { score: 0, maxScore: 0, correct: 0, wrong: 0, empty: 0, passed: null }) };
    }),
    ranking: { ...ranking, average: round1(ranking.average), averagePercent: pct(ranking.average, result.maxScore) },
    topics,
    difficulty,
    recommendations,
    discussion: discussionGate(exam),
    canRetry: Boolean(state && !state.block && !state.ongoingAttemptId),
    attemptsUsed: state?.attemptsUsed ?? null,
  } as const;
}

export type AttemptResult = Extract<Awaited<ReturnType<typeof getAttemptResult>>, { kind: "selesai" }>;

export type ReviewStatus = "BENAR" | "SALAH" | "KOSONG" | "MENUNGGU_PENILAIAN";

export interface ReviewQuestion {
  id: string;
  number: number;
  sectionTitle: string;
  type: "PG_TUNGGAL" | "PG_JAMAK" | "BENAR_SALAH" | "ISIAN_SINGKAT" | "NUMERIK" | "ESSAY";
  topic: string;
  subject: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  bodyHtml: string;
  imageUrl: string | null;
  options: { id: string; label: string; bodyHtml: string; isCorrect: boolean; picked: boolean }[];
  answerText: string | null;
  correctText: string | null;
  status: ReviewStatus;
  score: number | null;
  explanationHtml: string;
  explanationVideoUrl: string | null;
}

/** Pembahasan per soal dengan urutan sama seperti saat dikerjakan (I.7). */
export async function getReview(attemptId: string, viewer: Viewer) {
  const owned = await ownedFinishedAttempt(attemptId, viewer);
  if (owned.kind !== "selesai") return owned;
  const core = owned.core;
  const exam = await prisma.exam.findUniqueOrThrow({
    where: { id: core.examId },
    select: { showDiscussion: true, discussionOpensAt: true },
  });
  const gate = discussionGate(exam);
  if (!gate.open && viewer.role !== "ADMIN") return { kind: "tertutup", opensAt: gate.opensAt, exam: { title: core.exam.title } } as const;

  const [examQuestions, answers] = await Promise.all([
    prisma.examQuestion.findMany({
      where: { examId: core.examId },
      orderBy: { order: "asc" },
      select: {
        sectionId: true,
        question: {
          select: {
            id: true,
            type: true,
            topic: true,
            subject: true,
            difficulty: true,
            body: true,
            explanation: true,
            explanationVideoUrl: true,
            correctText: true,
            correctNumber: true,
            tolerance: true,
            image: { select: { publicId: true } },
            options: { orderBy: { order: "asc" }, select: { id: true, body: true, isCorrect: true } },
          },
        },
      },
    }),
    prisma.examAnswer.findMany({
      where: { attemptId },
      select: { questionId: true, optionIds: true, textAnswer: true, numberAnswer: true, isCorrect: true, score: true },
    }),
  ]);
  const answerOf = new Map(answers.map((a) => [a.questionId, a]));
  const grouped = core.exam.sections.map((s) => ({
    id: s.id,
    title: s.title,
    questions: examQuestions.filter((q) => q.sectionId === s.id).map((q) => q.question),
  }));
  const ordered = orderForAttempt(grouped, core.seed, core.exam);
  const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 });

  let n = 0;
  const questions: ReviewQuestion[] = ordered.flatMap((s) =>
    s.questions.map((q) => {
      const a = answerOf.get(q.id);
      const picked = new Set(Array.isArray(a?.optionIds) ? (a.optionIds as string[]) : []);
      const answerText =
        q.type === "NUMERIK" ? (a?.numberAnswer !== null && a?.numberAnswer !== undefined ? num.format(a.numberAnswer) : null) : (a?.textAnswer?.trim() ? a.textAnswer : null);
      const hasAnswer = picked.size > 0 || answerText !== null;
      const status: ReviewStatus = !hasAnswer ? "KOSONG" : a?.isCorrect === true ? "BENAR" : a?.isCorrect === false ? "SALAH" : "MENUNGGU_PENILAIAN";
      const correctText =
        q.type === "NUMERIK" && q.correctNumber !== null
          ? `${num.format(q.correctNumber)}${q.tolerance ? ` (toleransi ±${num.format(q.tolerance)})` : ""}`
          : q.type === "ISIAN_SINGKAT"
            ? (q.correctText ?? "").split("|").join(" atau ")
            : null;
      return {
        id: q.id,
        number: ++n,
        sectionTitle: s.title,
        type: q.type,
        topic: q.topic,
        subject: q.subject,
        difficulty: q.difficulty,
        bodyHtml: sanitizeRichText(q.body),
        imageUrl: q.image ? imageUrl(q.image.publicId, 960) : null,
        options: q.options.map((o, i) => ({ id: o.id, label: optionLabel(i), bodyHtml: sanitizeRichText(o.body), isCorrect: o.isCorrect, picked: picked.has(o.id) })),
        answerText,
        correctText,
        status,
        score: a?.score ?? null,
        explanationHtml: sanitizeRichText(q.explanation),
        explanationVideoUrl: q.explanationVideoUrl,
      };
    }),
  );
  return { kind: "terbuka", attemptId, exam: { title: core.exam.title }, questions } as const;
}

export type Review = Extract<Awaited<ReturnType<typeof getReview>>, { kind: "terbuka" }>;
