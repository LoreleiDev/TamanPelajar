import type { Prisma } from "@/generated/prisma/client";
import { imageUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "../guard";
import type { ExportQuestion } from "./csv";
import { OPTION_LABELS, type QuestionFilter, type QuestionInput } from "./schemas";

const PAGE_SIZE = 25;

function whereOf(filter: Omit<QuestionFilter, "page">): Prisma.QuestionWhereInput {
  return {
    deletedAt: null,
    ...(filter.category && { category: { slug: filter.category } }),
    ...(filter.subject && { subject: filter.subject }),
    ...(filter.type && { type: filter.type }),
    ...(filter.difficulty && { difficulty: filter.difficulty }),
    ...(filter.status && { status: filter.status }),
    ...(filter.q && { OR: [{ body: { contains: filter.q } }, { topic: { contains: filter.q } }, { subject: { contains: filter.q } }] }),
  };
}

/** Bank soal dengan pencarian dan filter (M.5.6). */
export async function listQuestions(filter: QuestionFilter) {
  await adminOnly();
  const where = whereOf(filter);
  const [total, rows] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        body: true,
        subject: true,
        topic: true,
        type: true,
        difficulty: true,
        status: true,
        weight: true,
        updatedAt: true,
        category: { select: { shortName: true } },
        createdBy: { select: { name: true } },
        _count: { select: { examQuestions: true } },
      },
    }),
  ]);
  return {
    rows: rows.map(({ _count, category, createdBy, body, ...q }) => ({
      ...q,
      // Ringkas untuk tabel: tanpa tag HTML, dipotong.
      excerpt: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140),
      category: category.shortName,
      author: createdBy.name,
      usedIn: _count.examQuestions,
    })),
    total,
    page: filter.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Pilihan kategori dan mata pelajaran untuk filter dan form. */
export async function getQuestionMeta() {
  await adminOnly();
  const [categories, subjects, topics] = await Promise.all([
    prisma.courseCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, slug: true, name: true, shortName: true } }),
    prisma.subject.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { name: true } }),
    prisma.question.findMany({ where: { deletedAt: null }, distinct: ["topic"], orderBy: { topic: "asc" }, select: { topic: true } }),
  ]);
  return { categories, subjects: subjects.map((s) => s.name), topics: topics.map((t) => t.topic) };
}

const fullSelect = {
  id: true,
  categoryId: true,
  subject: true,
  topic: true,
  difficulty: true,
  type: true,
  body: true,
  explanation: true,
  explanationVideoUrl: true,
  imageId: true,
  image: { select: { publicId: true } },
  correctText: true,
  correctNumber: true,
  tolerance: true,
  weight: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { name: true, slug: true } },
  createdBy: { select: { name: true } },
  options: { orderBy: { order: "asc" }, select: { id: true, label: true, body: true, isCorrect: true, score: true, order: true } },
  examQuestions: { select: { exam: { select: { id: true, title: true } }, section: { select: { title: true } } } },
} as const satisfies Prisma.QuestionSelect;

export async function getQuestion(id: string) {
  await adminOnly();
  const q = await prisma.question.findFirst({ where: { id, deletedAt: null }, select: fullSelect });
  if (!q) return null;
  return { ...q, imageUrl: q.image ? imageUrl(q.image.publicId, 960) : null };
}

export type AdminQuestion = NonNullable<Awaited<ReturnType<typeof getQuestion>>>;

const str = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

/** Nilai awal form dari soal tersimpan; opsi selalu lima baris (A–E). */
export function questionDefaults(q: AdminQuestion): QuestionInput {
  return {
    id: q.id,
    categoryId: q.categoryId,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    type: q.type,
    body: q.body,
    explanation: q.explanation,
    explanationVideoUrl: q.explanationVideoUrl ?? "",
    imageId: q.imageId,
    correctText: q.correctText ?? "",
    correctNumber: str(q.correctNumber),
    tolerance: str(q.tolerance),
    weight: str(q.weight),
    status: q.status,
    options: OPTION_LABELS.map((_, i) => {
      const o = q.options[i];
      return { body: o?.body ?? "", isCorrect: o?.isCorrect ?? false, score: o?.score === null || o?.score === undefined ? "" : str(o.score) };
    }),
  };
}

/** Soal untuk ekspor (M.5.3), memakai filter yang sama dengan halaman bank soal. */
export async function exportQuestions(filter: Omit<QuestionFilter, "page">): Promise<ExportQuestion[]> {
  await adminOnly();
  const rows = await prisma.question.findMany({
    where: whereOf(filter),
    orderBy: [{ category: { order: "asc" } }, { subject: "asc" }, { topic: "asc" }, { createdAt: "asc" }],
    select: {
      subject: true,
      topic: true,
      difficulty: true,
      type: true,
      body: true,
      correctText: true,
      correctNumber: true,
      tolerance: true,
      explanation: true,
      weight: true,
      status: true,
      category: { select: { slug: true } },
      options: { orderBy: { order: "asc" }, select: { label: true, body: true, isCorrect: true } },
    },
  });
  return rows.map(({ category, ...q }) => ({ ...q, categorySlug: category.slug }));
}
