import { prisma } from "@/lib/prisma";

import { adminOnly } from "../guard";

/** Soal bank soal untuk kuis materi (L.2.5): belum ada di kuis ini, bukan essay. */
export async function searchQuestionsForQuiz(quizId: string, filter: { q?: string; categoryId?: string; subject?: string; difficulty?: string }) {
  await adminOnly();
  const used = await prisma.quizQuestion.findMany({ where: { quizId }, select: { questionId: true } });
  const rows = await prisma.question.findMany({
    where: {
      deletedAt: null,
      status: { not: "ARSIP" },
      type: { not: "ESSAY" },
      id: { notIn: used.map((u) => u.questionId) },
      ...(filter.categoryId && { categoryId: filter.categoryId }),
      ...(filter.subject && { subject: filter.subject }),
      ...(filter.difficulty && { difficulty: filter.difficulty as "MUDAH" | "SEDANG" | "SULIT" }),
      ...(filter.q && { OR: [{ body: { contains: filter.q } }, { topic: { contains: filter.q } }] }),
    },
    orderBy: [{ subject: "asc" }, { topic: "asc" }, { createdAt: "asc" }],
    take: 100,
    select: { id: true, body: true, subject: true, topic: true, type: true, difficulty: true, status: true },
  });
  return rows.map(({ body, ...q }) => ({ ...q, excerpt: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) }));
}
