import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

/** Nama mata pelajaran untuk pilihan di form admin. */
export async function listSubjectNames() {
  await adminOnly();
  return (await prisma.subject.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { name: true } })).map((s) => s.name);
}

/** Daftar mata pelajaran beserta jumlah kelas, video, dan soal yang memakainya. */
export async function listSubjects() {
  await adminOnly();
  const [subjects, courses, videos, questions] = await Promise.all([
    prisma.subject.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.course.groupBy({ by: ["subject"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.video.groupBy({ by: ["subject"], _count: { _all: true } }),
    prisma.question.groupBy({ by: ["subject"], where: { deletedAt: null }, _count: { _all: true } }),
  ]);
  const count = (rows: { subject: string; _count: { _all: number } }[], name: string) =>
    rows.find((r) => r.subject.toLowerCase() === name.toLowerCase())?._count._all ?? 0;
  return subjects.map((s) => ({
    ...s,
    courses: count(courses, s.name),
    videos: count(videos, s.name),
    questions: count(questions, s.name),
  }));
}

/** Pastikan nama mata pelajaran terdaftar; mengembalikan ejaan resmi dari daftar admin. */
export async function resolveSubject(name: string): Promise<string | null> {
  const s = await prisma.subject.findFirst({ where: { name: name.trim() }, select: { name: true } });
  return s?.name ?? null;
}
