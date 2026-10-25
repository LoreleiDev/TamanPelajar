// Pembacaan data tryout (I.1–I.4). Data tryout publik di-cache (tag "katalog"); keadaan
// per pengguna dan sesi ujian dibaca per request. Kunci jawaban dan pembahasan tidak
// pernah dipilih di query sesi ujian.

import { cacheLife, cacheTag } from "next/cache";

import { imageUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";

import { loadAttempt, syncAttempt } from "./attempt";
import { optionLabel, orderForAttempt, startBlock, type StartBlock } from "./engine";

const publishedExam = { status: "TERBIT", deletedAt: null } as const;
const publishedProduct = { status: "TERBIT", deletedAt: null } as const;

export interface ExamListItem {
  slug: string;
  title: string;
  description: string;
  category: { name: string; shortName: string };
  durationMin: number;
  questionCount: number;
  sectionCount: number;
  opensAt: Date | null;
  closesAt: Date | null;
  maxAttempts: number;
  products: { slug: string; name: string }[];
}

/** Daftar tryout publik (I.1, C.5.1). */
export async function listExams(): Promise<ExamListItem[]> {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  const rows = await prisma.exam.findMany({
    where: publishedExam,
    orderBy: [{ category: { order: "asc" } }, { title: "asc" }],
    select: {
      slug: true,
      title: true,
      description: true,
      durationMin: true,
      opensAt: true,
      closesAt: true,
      maxAttempts: true,
      category: { select: { name: true, shortName: true } },
      _count: { select: { questions: true, sections: true } },
      products: {
        where: { product: publishedProduct },
        orderBy: { product: { price: "asc" } },
        select: { product: { select: { slug: true, name: true } } },
      },
    },
  });
  return rows.map(({ _count, products, ...e }) => ({
    ...e,
    questionCount: _count.questions,
    sectionCount: _count.sections,
    products: products.map((p) => p.product),
  }));
}

export async function listExamSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  const rows = await prisma.exam.findMany({ where: publishedExam, select: { slug: true } });
  return rows.map((r) => r.slug);
}

/** Detail untuk halaman petunjuk (I.2). */
export async function getExamDetail(slug: string) {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  const e = await prisma.exam.findFirst({
    where: { slug, ...publishedExam },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      rules: true,
      durationMin: true,
      opensAt: true,
      closesAt: true,
      maxAttempts: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      showDiscussion: true,
      discussionOpensAt: true,
      correctScore: true,
      wrongScore: true,
      passingGrade: true,
      category: { select: { name: true, shortName: true } },
      image: { select: { publicId: true } },
      sections: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, durationMin: true, passingGrade: true, weight: true, _count: { select: { questions: true } } },
      },
      _count: { select: { questions: true } },
      products: {
        where: { product: publishedProduct },
        orderBy: { product: { price: "asc" } },
        select: { product: { select: { slug: true, name: true, price: true, promoPrice: true } } },
      },
    },
  });
  if (!e) return null;
  const { _count, sections, products, image, ...rest } = e;
  return {
    ...rest,
    imageUrl: image ? imageUrl(image.publicId, 720) : null,
    questionCount: _count.questions,
    sections: sections.map(({ _count: c, ...s }) => ({ ...s, questionCount: c.questions })),
    products: products.map((p) => p.product),
  };
}

export type ExamDetail = NonNullable<Awaited<ReturnType<typeof getExamDetail>>>;

async function enrolledExamIds(userId: string, examIds: string[]) {
  const rows = await prisma.productExam.findMany({
    where: {
      examId: { in: examIds },
      product: { enrollments: { some: { userId, status: "AKTIF", expiresAt: { gt: new Date() } } } },
    },
    select: { examId: true },
  });
  return new Set(rows.map((r) => r.examId));
}

export interface UserExamState {
  enrolled: boolean;
  attemptsUsed: number;
  ongoingAttemptId: string | null;
  bestPercent: number | null;
  lastFinishedAttemptId: string | null;
  status: "Belum mulai" | "Sedang dikerjakan" | "Selesai";
  block: StartBlock | null;
}

/** Keadaan tryout per pengguna: paket, percobaan, nilai tertinggi (I.1, I.2). */
export async function getUserExamStates(user: { id: string; role: string }, slugs?: string[]): Promise<Map<string, UserExamState>> {
  const exams = await prisma.exam.findMany({
    where: { ...publishedExam, ...(slugs ? { slug: { in: slugs } } : {}) },
    select: {
      id: true,
      slug: true,
      opensAt: true,
      closesAt: true,
      maxAttempts: true,
      attempts: {
        where: { userId: user.id },
        orderBy: { attemptNo: "desc" },
        select: { id: true, status: true, deadlineAt: true, result: { select: { totalScore: true, maxScore: true } } },
      },
    },
  });
  const enrolled = await enrolledExamIds(
    user.id,
    exams.map((e) => e.id),
  );
  const now = new Date();
  const out = new Map<string, UserExamState>();
  for (const e of exams) {
    const done = e.attempts.filter((a) => a.status !== "BERLANGSUNG" && a.result);
    const ongoing = e.attempts.find((a) => a.status === "BERLANGSUNG" && a.deadlineAt > now) ?? null;
    const best = done.reduce((m, a) => Math.max(m, a.result!.maxScore > 0 ? (a.result!.totalScore / a.result!.maxScore) * 100 : 0), 0);
    out.set(e.slug, {
      enrolled: enrolled.has(e.id),
      attemptsUsed: e.attempts.length,
      ongoingAttemptId: ongoing?.id ?? null,
      bestPercent: done.length ? Math.round(best * 10) / 10 : null,
      lastFinishedAttemptId: done[0]?.id ?? null,
      status: ongoing ? "Sedang dikerjakan" : done.length ? "Selesai" : "Belum mulai",
      block: startBlock({
        now,
        loggedIn: true,
        isAdmin: user.role === "ADMIN",
        enrolled: enrolled.has(e.id),
        opensAt: e.opensAt,
        closesAt: e.closesAt,
        attemptsUsed: e.attempts.length,
        maxAttempts: e.maxAttempts,
      }),
    });
  }
  return out;
}

export interface ExamSessionQuestion {
  id: string;
  number: number;
  sectionId: string;
  type: "PG_TUNGGAL" | "PG_JAMAK" | "BENAR_SALAH" | "ISIAN_SINGKAT" | "NUMERIK" | "ESSAY";
  bodyHtml: string;
  imageUrl: string | null;
  options: { id: string; label: string; bodyHtml: string; imageUrl: string | null }[];
}

export interface ExamSessionAnswer {
  optionIds: string[] | null;
  textAnswer: string | null;
  numberAnswer: number | null;
  isDoubtful: boolean;
}

export type ExamSession =
  | { state: "selesai"; attemptId: string }
  | {
      state: "berlangsung";
      attemptId: string;
      exam: { slug: string; title: string };
      mode: "berurutan" | "bebas";
      sections: { id: string; title: string; questionCount: number; startedAt: string | null; deadlineAt: string | null; submittedAt: string | null }[];
      activeSectionId: string;
      deadlineAt: string;
      serverNow: string;
      questions: ExamSessionQuestion[];
      answers: Record<string, ExamSessionAnswer>;
      currentQuestionId: string | null;
    };

/**
 * Sesi ujian untuk halaman pengerjaan (I.3–I.4). Mengembalikan null bila percobaan tidak
 * ada atau bukan milik pengguna. Jadwal dimajukan dulu; percobaan yang waktunya habis
 * langsung dikumpulkan sehingga halaman diarahkan ke hasil.
 */
export async function getExamSession(attemptId: string, userId: string): Promise<ExamSession | null> {
  const attempt = await loadAttempt(attemptId);
  if (!attempt || attempt.userId !== userId) return null;
  const synced = await syncAttempt(attempt);
  if (synced.finished || !synced.timeline) return { state: "selesai", attemptId };
  const timeline = synced.timeline;

  const [examQuestions, answers] = await Promise.all([
    prisma.examQuestion.findMany({
      where: { examId: attempt.examId },
      orderBy: { order: "asc" },
      select: {
        sectionId: true,
        question: {
          select: {
            id: true,
            type: true,
            body: true,
            image: { select: { publicId: true } },
            // Hanya id, label, dan isi opsi: isCorrect dan score tidak pernah dikirim.
            options: { orderBy: { order: "asc" }, select: { id: true, body: true, image: { select: { publicId: true } } } },
          },
        },
      },
    }),
    prisma.examAnswer.findMany({
      where: { attemptId },
      select: { questionId: true, optionIds: true, textAnswer: true, numberAnswer: true, isDoubtful: true },
    }),
  ]);

  const grouped = attempt.exam.sections.map((s) => ({
    id: s.id,
    questions: examQuestions.filter((q) => q.sectionId === s.id).map((q) => ({ ...q.question, sectionId: s.id })),
  }));
  const ordered = orderForAttempt(grouped, attempt.seed, attempt.exam);

  let number = 0;
  const questions: ExamSessionQuestion[] = ordered.flatMap((s) =>
    s.questions.map((q) => ({
      id: q.id,
      number: ++number,
      sectionId: s.id,
      type: q.type,
      bodyHtml: sanitizeRichText(q.body),
      imageUrl: q.image ? imageUrl(q.image.publicId, 960) : null,
      options: q.options.map((o, i) => ({
        id: o.id,
        label: optionLabel(i),
        bodyHtml: sanitizeRichText(o.body),
        imageUrl: o.image ? imageUrl(o.image.publicId, 480) : null,
      })),
    })),
  );

  const timing = new Map(timeline.sections.map((s) => [s.sectionId, s]));
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  return {
    state: "berlangsung",
    attemptId,
    exam: { slug: attempt.exam.slug, title: attempt.exam.title },
    mode: timeline.mode,
    sections: attempt.exam.sections.map((s) => ({
      id: s.id,
      title: s.title,
      questionCount: questions.filter((q) => q.sectionId === s.id).length,
      startedAt: iso(timing.get(s.id)?.startedAt ?? null),
      deadlineAt: iso(timing.get(s.id)?.deadlineAt ?? null),
      submittedAt: iso(timing.get(s.id)?.submittedAt ?? null),
    })),
    activeSectionId: attempt.exam.sections[timeline.activeIndex].id,
    deadlineAt: (timeline.deadlineAt ?? attempt.deadlineAt).toISOString(),
    serverNow: new Date().toISOString(),
    questions,
    answers: Object.fromEntries(
      answers.map((a) => [
        a.questionId,
        {
          optionIds: Array.isArray(a.optionIds) ? (a.optionIds as string[]) : null,
          textAnswer: a.textAnswer,
          numberAnswer: a.numberAnswer,
          isDoubtful: a.isDoubtful,
        },
      ]),
    ),
    currentQuestionId: attempt.currentQuestionId,
  };
}
