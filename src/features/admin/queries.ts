import { prisma } from "@/lib/prisma";

import { countUnansweredDiscussions } from "./discussions";
import { countPendingEssays } from "./grading";
import { adminOnly } from "./guard";
import { countPendingPracticals } from "./practicals";
import { fillMonths, lastMonths, percent } from "./stats";

// Data dashboard admin (M.2) dan angka penanda menu. Semua query memeriksa role admin.

export async function getAdminBadges() {
  await adminOnly();
  const [transaksi, penilaian, diskusi, tugas] = await Promise.all([
    prisma.order.count({ where: { status: "MENUNGGU", expiresAt: { gt: new Date() }, deletedAt: null } }),
    countPendingEssays(),
    countUnansweredDiscussions(),
    countPendingPracticals(),
  ]);
  return { transaksi, penilaian, diskusi, tugas };
}

const num = (v: unknown) => Number(v ?? 0);

export async function getAdminDashboard(now = new Date()) {
  await adminOnly();
  const { keys, since } = lastMonths(now, 6);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

  const [
    totalUsers,
    newUsers,
    paidOrders,
    revenue,
    pendingOrders,
    topProducts,
    topExams,
    revenueRows,
    userRows,
    completionRows,
    recentOrders,
    recentUsers,
    recentResults,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER", deletedAt: null } }),
    prisma.user.count({ where: { role: "USER", deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.count({ where: { status: "BERHASIL" } }),
    prisma.order.aggregate({ where: { status: "BERHASIL" }, _sum: { total: true } }),
    prisma.order.count({ where: { status: "MENUNGGU", expiresAt: { gt: now } } }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ salesCount: "desc" }, { name: "asc" }],
      take: 5,
      select: { id: true, name: true, salesCount: true, category: { select: { shortName: true } } },
    }),
    prisma.exam.findMany({
      where: { deletedAt: null },
      orderBy: { attempts: { _count: "desc" } },
      take: 5,
      select: { id: true, title: true, _count: { select: { attempts: true } } },
    }),
    prisma.$queryRaw<{ month: string; value: unknown }[]>`
      SELECT DATE_FORMAT(DATE_ADD(paidAt, INTERVAL 7 HOUR), '%Y-%m') AS month, SUM(total) AS value
      FROM \`Order\` WHERE status = 'BERHASIL' AND paidAt >= ${since} GROUP BY month`,
    prisma.$queryRaw<{ month: string; value: unknown }[]>`
      SELECT DATE_FORMAT(DATE_ADD(createdAt, INTERVAL 7 HOUR), '%Y-%m') AS month, COUNT(*) AS value
      FROM \`User\` WHERE role = 'USER' AND deletedAt IS NULL AND createdAt >= ${since} GROUP BY month`,
    // Tingkat penyelesaian (M.2.5): pengguna yang menyelesaikan semua materi dibanding yang memulai.
    prisma.$queryRaw<{ id: string; title: string; started: unknown; completed: unknown }[]>`
      SELECT c.id, c.title, COUNT(p.userId) AS started, COALESCE(SUM(p.done >= t.total), 0) AS completed
      FROM Course c
      JOIN (SELECT s.courseId, COUNT(*) AS total FROM Lesson l JOIN CourseSection s ON s.id = l.sectionId GROUP BY s.courseId) t
        ON t.courseId = c.id
      LEFT JOIN (
        SELECT s.courseId, lp.userId, SUM(lp.completedAt IS NOT NULL) AS done
        FROM LessonProgress lp JOIN Lesson l ON l.id = lp.lessonId JOIN CourseSection s ON s.id = l.sectionId
        GROUP BY s.courseId, lp.userId
      ) p ON p.courseId = c.id
      WHERE c.deletedAt IS NULL
      GROUP BY c.id, c.title
      ORDER BY started DESC, c.title ASC`,
    prisma.order.findMany({
      where: { status: "BERHASIL" },
      orderBy: { paidAt: "desc" },
      take: 5,
      select: { number: true, total: true, paidAt: true, user: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { role: "USER", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.examResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        totalScore: true,
        maxScore: true,
        createdAt: true,
        attempt: { select: { id: true, user: { select: { name: true } }, exam: { select: { title: true } } } },
      },
    }),
  ]);

  const activity = [
    ...recentOrders.map((o) => ({
      at: o.paidAt ?? new Date(0),
      kind: "transaksi" as const,
      text: `${o.user.name} membayar pesanan ${o.number}`,
      amount: o.total,
      href: `/admin/transaksi/${o.number}`,
    })),
    ...recentUsers.map((u) => ({ at: u.createdAt, kind: "pengguna" as const, text: `${u.name} mendaftar`, href: `/admin/pengguna/${u.id}` })),
    ...recentResults.map((r) => ({
      at: r.createdAt,
      kind: "tryout" as const,
      text: `${r.attempt.user.name} menyelesaikan ${r.attempt.exam.title}`,
      score: `${Math.round(r.totalScore * 10) / 10}/${Math.round(r.maxScore * 10) / 10}`,
      href: `/tryout/hasil/${r.attempt.id}`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return {
    totalUsers,
    newUsers,
    paidOrders,
    revenue: revenue._sum.total ?? 0,
    pendingOrders,
    topProducts,
    topExams: topExams.map((e) => ({ id: e.id, title: e.title, attempts: e._count.attempts })),
    revenueByMonth: fillMonths(keys, revenueRows.map((r) => ({ month: r.month, value: num(r.value) }))),
    usersByMonth: fillMonths(keys, userRows.map((r) => ({ month: r.month, value: num(r.value) }))),
    completion: completionRows.map((c) => ({
      id: c.id,
      title: c.title,
      started: num(c.started),
      completed: num(c.completed),
      rate: percent(num(c.completed), num(c.started)),
    })),
    activity,
  };
}

const AUDIT_PAGE_SIZE = 30;

/** Jejak tindakan admin (P.1.10) dengan filter entitas dan pagination. */
export async function listAuditLogs(filter: { entity?: string; q?: string; page: number }) {
  await adminOnly();
  const where = {
    ...(filter.entity && { entity: filter.entity }),
    ...(filter.q && { OR: [{ action: { contains: filter.q } }, { entityId: { contains: filter.q } }, { actor: { name: { contains: filter.q } } }] }),
  };
  const [total, rows, entities] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      select: { id: true, action: true, entity: true, entityId: true, before: true, after: true, ip: true, createdAt: true, actor: { select: { id: true, name: true } } },
    }),
    prisma.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
  ]);
  return { rows, total, entities: entities.map((e) => e.entity), page: filter.page, pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) };
}
