import type { Prisma } from "@/generated/prisma/client";
import { expireDueOrders } from "@/features/payment/orders";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "../guard";
import type { OrderFilter } from "./schemas";

const PAGE_SIZE = 20;

/** Daftar transaksi semua pengguna (C.2.6). Pesanan lewat batas bayar ditandai lebih dulu. */
export async function listOrders(filter: OrderFilter) {
  await adminOnly();
  await expireDueOrders();
  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
    ...(filter.status && { status: filter.status }),
    ...(filter.q && {
      OR: [{ number: { contains: filter.q } }, { user: { email: { contains: filter.q } } }, { user: { name: { contains: filter.q } } }],
    }),
  };
  const [total, sum, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({ where: { ...where, status: "BERHASIL" }, _sum: { total: true } }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        discount: true,
        createdAt: true,
        paidAt: true,
        user: { select: { id: true, name: true, email: true } },
        items: { select: { nameSnapshot: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1, select: { method: true } },
      },
    }),
  ]);
  return {
    rows: rows.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      discount: o.discount,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      user: o.user,
      products: o.items.map((i) => i.nameSnapshot).join(", "),
      method: o.payments[0]?.method ?? null,
    })),
    total,
    paidTotal: sum._sum.total ?? 0,
    page: filter.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Detail transaksi untuk admin, termasuk riwayat pembayaran dan jejak audit. */
export async function getAdminOrder(number: string) {
  await adminOnly();
  const found = await prisma.order.findUnique({ where: { number }, select: { id: true, userId: true, deletedAt: true } });
  if (!found || found.deletedAt) return null;
  await expireDueOrders(found.userId);
  const [order, logs] = await Promise.all([
    prisma.order.findUniqueOrThrow({
      where: { number },
      select: {
        id: true,
        number: true,
        status: true,
        subtotal: true,
        discount: true,
        total: true,
        createdAt: true,
        expiresAt: true,
        paidAt: true,
        voucher: { select: { code: true } },
        user: { select: { id: true, name: true, email: true } },
        items: { select: { id: true, nameSnapshot: true, price: true, promoPrice: true, activeDays: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          select: { id: true, provider: true, method: true, status: true, externalId: true, vaNumber: true, paidAt: true, createdAt: true },
        },
        enrollments: { select: { id: true, status: true, expiresAt: true, product: { select: { name: true } } } },
      },
    }),
    prisma.auditLog.findMany({
      where: { entity: "Order", entityId: found.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
    }),
  ]);
  return { ...order, logs };
}
