import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

// Laporan admin (M.2, L.2.9): ringkasan per paket untuk rentang dari report-range.ts.

export async function getSalesReport(range: { start: Date; end: Date }) {
  await adminOnly();
  const [orders, items, newUsers, finishedTryouts] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { createdAt: { gte: range.start, lt: range.end }, deletedAt: null }, _count: true, _sum: { total: true, discount: true } }),
    prisma.orderItem.findMany({
      where: { order: { status: "BERHASIL", paidAt: { gte: range.start, lt: range.end } } },
      select: { productId: true, nameSnapshot: true, price: true, promoPrice: true },
    }),
    prisma.user.count({ where: { role: "USER", createdAt: { gte: range.start, lt: range.end } } }),
    prisma.examAttempt.count({ where: { status: "SELESAI", submittedAt: { gte: range.start, lt: range.end } } }),
  ]);
  const byProduct = new Map<string, { name: string; count: number; revenue: number }>();
  for (const i of items) {
    const cur = byProduct.get(i.productId) ?? { name: i.nameSnapshot, count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += i.promoPrice ?? i.price;
    byProduct.set(i.productId, cur);
  }
  const paid = orders.find((o) => o.status === "BERHASIL");
  return {
    statuses: orders.map((o) => ({ status: o.status, count: o._count, total: o._sum.total ?? 0 })),
    revenue: paid?._sum.total ?? 0,
    discount: paid?._sum.discount ?? 0,
    paidOrders: paid?._count ?? 0,
    newUsers,
    finishedTryouts,
    products: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue),
  };
}

export async function listReportTargets() {
  await adminOnly();
  const [exams, courses] = await Promise.all([
    prisma.exam.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true, _count: { select: { attempts: true } } } }),
    prisma.course.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  return { exams, courses };
}
