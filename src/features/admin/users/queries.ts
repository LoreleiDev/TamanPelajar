import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "../guard";
import type { UserFilter } from "./schemas";

export const PAGE_SIZE = 20;

/** Daftar pengguna untuk admin (M.3) dengan pencarian, filter, dan pagination server. */
export async function listUsers(filter: UserFilter) {
  await adminOnly();
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(filter.role && { role: filter.role }),
    ...(filter.status && { isActive: filter.status === "aktif" }),
    ...(filter.q && { OR: [{ name: { contains: filter.q } }, { email: { contains: filter.q } }] }),
  };
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { orders: { where: { status: "BERHASIL" } }, enrollments: { where: { status: "AKTIF" } } } },
      },
    }),
  ]);
  return {
    rows: rows.map(({ _count, ...u }) => ({ ...u, paidOrders: _count.orders, activePrograms: _count.enrollments })),
    total,
    page: filter.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Detail pengguna: profil, program, riwayat belajar, tryout, dan transaksi (M.3). */
export async function getUserDetail(id: string) {
  await adminOnly();
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      lockedUntil: true,
      createdAt: true,
      lastLoginAt: true,
      passwordHash: true,
      accounts: { select: { provider: true } },
      profile: { select: { phone: true, educationLevel: true, examTarget: true, school: true, city: true } },
      enrollments: {
        orderBy: { expiresAt: "desc" },
        select: { id: true, status: true, startsAt: true, expiresAt: true, product: { select: { name: true, slug: true } } },
      },
      examAttempts: {
        orderBy: { startedAt: "desc" },
        take: 20,
        select: {
          id: true,
          attemptNo: true,
          status: true,
          startedAt: true,
          exam: { select: { title: true } },
          result: { select: { totalScore: true, maxScore: true, passed: true } },
        },
      },
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { number: true, status: true, total: true, createdAt: true, items: { select: { nameSnapshot: true } } },
      },
      learningSessions: { select: { seconds: true } },
    },
  });
  if (!user) return null;

  // Progres per kelas yang pernah dibuka: materi selesai dibanding total materi kelas.
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: id },
    select: { completedAt: true, updatedAt: true, lesson: { select: { section: { select: { courseId: true } } } } },
  });
  const byCourse = new Map<string, { done: number; last: Date }>();
  for (const p of progress) {
    const cid = p.lesson.section.courseId;
    const cur = byCourse.get(cid) ?? { done: 0, last: p.updatedAt };
    byCourse.set(cid, { done: cur.done + (p.completedAt ? 1 : 0), last: p.updatedAt > cur.last ? p.updatedAt : cur.last });
  }
  const courses = byCourse.size
    ? await prisma.course.findMany({
        where: { id: { in: [...byCourse.keys()] } },
        select: { id: true, title: true, slug: true, sections: { select: { _count: { select: { lessons: true } } } } },
      })
    : [];

  const { passwordHash, learningSessions, ...rest } = user;
  return {
    ...rest,
    hasPassword: Boolean(passwordHash),
    studySeconds: learningSessions.reduce((a, s) => a + s.seconds, 0),
    courses: courses
      .map((c) => {
        const total = c.sections.reduce((a, s) => a + s._count.lessons, 0);
        const p = byCourse.get(c.id)!;
        return { id: c.id, title: c.title, slug: c.slug, done: p.done, total, last: p.last };
      })
      .sort((a, b) => b.last.getTime() - a.last.getTime()),
  };
}
