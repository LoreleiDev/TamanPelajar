import type { Prisma } from "@/generated/prisma/client";
import { imageUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "../guard";

/** Daftar tryout untuk admin (M.6), termasuk draf dan arsip. */
export async function listAdminExams(filter: { q?: string; status?: "DRAF" | "TERBIT" | "ARSIP" }) {
  await adminOnly();
  const where: Prisma.ExamWhereInput = {
    deletedAt: null,
    ...(filter.status && { status: filter.status }),
    ...(filter.q && { title: { contains: filter.q } }),
  };
  const rows = await prisma.exam.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      durationMin: true,
      opensAt: true,
      closesAt: true,
      category: { select: { shortName: true } },
      _count: { select: { questions: true, sections: true, attempts: true } },
    },
  });
  return rows.map(({ _count, category, ...e }) => ({ ...e, category: category.shortName, questions: _count.questions, sections: _count.sections, attempts: _count.attempts }));
}

export async function getExamCategories() {
  await adminOnly();
  return prisma.courseCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } });
}

/** Tryout lengkap untuk halaman ubah: pengaturan, subtes, dan soal per subtes. */
export async function getAdminExam(id: string) {
  await adminOnly();
  const exam = await prisma.exam.findFirst({
    where: { id, deletedAt: null },
    include: {
      image: { select: { publicId: true } },
      category: { select: { name: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              weight: true,
              question: { select: { id: true, body: true, type: true, topic: true, difficulty: true, weight: true, status: true, deletedAt: true } },
            },
          },
        },
      },
      _count: { select: { attempts: true } },
    },
  });
  if (!exam) return null;
  const running = await prisma.examAttempt.count({ where: { examId: id, status: "BERLANGSUNG" } });
  return { ...exam, imageUrl: exam.image ? imageUrl(exam.image.publicId, 640) : null, attemptCount: exam._count.attempts, runningAttempts: running };
}

export type AdminExam = NonNullable<Awaited<ReturnType<typeof getAdminExam>>>;

/** Soal bank soal yang bisa ditambahkan ke tryout (M.6.8), belum ada di tryout ini. */
export async function searchQuestionsForExam(examId: string, filter: { q?: string; categoryId?: string; subject?: string; difficulty?: string }) {
  await adminOnly();
  const used = await prisma.examQuestion.findMany({ where: { examId }, select: { questionId: true } });
  const rows = await prisma.question.findMany({
    where: {
      deletedAt: null,
      status: { not: "ARSIP" },
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

/** Seluruh soal tryout lengkap dengan kunci untuk pratinjau admin (M.6.9). */
export async function getExamPreview(id: string) {
  await adminOnly();
  const exam = await prisma.exam.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      durationMin: true,
      correctScore: true,
      wrongScore: true,
      passingGrade: true,
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          durationMin: true,
          weight: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              weight: true,
              question: {
                select: {
                  id: true,
                  type: true,
                  body: true,
                  topic: true,
                  difficulty: true,
                  weight: true,
                  correctText: true,
                  correctNumber: true,
                  tolerance: true,
                  explanation: true,
                  explanationVideoUrl: true,
                  image: { select: { publicId: true } },
                  options: { orderBy: { order: "asc" }, select: { id: true, label: true, body: true, isCorrect: true, score: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!exam) return null;
  return {
    ...exam,
    sections: exam.sections.map((s) => ({
      ...s,
      questions: s.questions.map(({ weight, question: { image, ...q } }) => ({
        ...q,
        weight: weight ?? q.weight,
        imageUrl: image ? imageUrl(image.publicId, 960) : null,
      })),
    })),
  };
}

/** Hasil semua peserta satu tryout (C.2.5, L.2.9): percobaan selesai beserta nilai. */
export async function getExamResults(id: string) {
  await adminOnly();
  const exam = await prisma.exam.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title: true, slug: true, passingGrade: true, sections: { orderBy: { order: "asc" }, select: { id: true, title: true } } },
  });
  if (!exam) return null;
  const attempts = await prisma.examAttempt.findMany({
    where: { examId: id },
    orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
    select: {
      id: true,
      attemptNo: true,
      status: true,
      startedAt: true,
      submittedAt: true,
      user: { select: { id: true, name: true, email: true } },
      result: {
        select: {
          totalScore: true,
          maxScore: true,
          correct: true,
          wrong: true,
          empty: true,
          durationSec: true,
          passed: true,
          sections: { select: { sectionId: true, score: true } },
        },
      },
      answers: { where: { question: { type: "ESSAY" }, gradedById: null, NOT: { textAnswer: null } }, select: { id: true } },
    },
  });
  return {
    exam,
    attempts: attempts.map(({ answers, ...a }) => ({ ...a, pendingEssays: answers.length })),
  };
}
