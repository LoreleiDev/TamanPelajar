import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

// Antrean penilaian essay (L.2.7): jawaban essay dari percobaan selesai yang belum dinilai.

const answerSelect = {
  id: true,
  textAnswer: true,
  score: true,
  updatedAt: true,
  gradedBy: { select: { name: true } },
  question: { select: { id: true, body: true, explanation: true, weight: true, topic: true } },
  attempt: {
    select: {
      id: true,
      attemptNo: true,
      submittedAt: true,
      user: { select: { id: true, name: true } },
      exam: {
        select: {
          id: true,
          title: true,
          correctScore: true,
          questions: { select: { questionId: true, weight: true } },
        },
      },
    },
  },
} as const;

type Row = Awaited<ReturnType<typeof prisma.examAnswer.findMany<{ select: typeof answerSelect }>>>[number];

/** Skor maksimum essay di tryout itu: bobot khusus tryout atau bobot soal, dikali skor benar. */
function maxScoreOf(a: Row) {
  const override = a.attempt.exam.questions.find((q) => q.questionId === a.question.id)?.weight;
  // Sama dengan questionMaxScore() untuk soal tanpa opsi bergradasi.
  return a.attempt.exam.correctScore * (override ?? a.question.weight);
}

const shape = (a: Row) => ({
  id: a.id,
  textAnswer: a.textAnswer ?? "",
  score: a.score,
  maxScore: maxScoreOf(a),
  gradedBy: a.gradedBy?.name ?? null,
  gradedAt: a.updatedAt,
  question: { body: a.question.body, explanation: a.question.explanation, topic: a.question.topic },
  attempt: { id: a.attempt.id, attemptNo: a.attempt.attemptNo, submittedAt: a.attempt.submittedAt, user: a.attempt.user, exam: { id: a.attempt.exam.id, title: a.attempt.exam.title } },
});

export async function getGradingQueue() {
  await adminOnly();
  const base = { question: { type: "ESSAY" as const }, attempt: { status: "SELESAI" as const }, NOT: { textAnswer: null } };
  const [pending, graded] = await Promise.all([
    prisma.examAnswer.findMany({ where: { ...base, gradedById: null, textAnswer: { not: "" } }, orderBy: { attempt: { submittedAt: "asc" } }, take: 50, select: answerSelect }),
    prisma.examAnswer.findMany({ where: { ...base, gradedById: { not: null } }, orderBy: { updatedAt: "desc" }, take: 20, select: answerSelect }),
  ]);
  return { pending: pending.map(shape), graded: graded.map(shape) };
}

export async function countPendingEssays() {
  return prisma.examAnswer.count({
    where: { question: { type: "ESSAY" }, attempt: { status: "SELESAI" }, gradedById: null, textAnswer: { not: "" }, NOT: { textAnswer: null } },
  });
}

/** Skor maksimum satu jawaban essay, untuk validasi nilai di server action. */
export async function essayMaxScore(answerId: string) {
  const a = await prisma.examAnswer.findUnique({ where: { id: answerId }, select: answerSelect });
  return a ? { maxScore: maxScoreOf(a), attemptId: a.attempt.id, userId: a.attempt.user.id, examTitle: a.attempt.exam.title } : null;
}
