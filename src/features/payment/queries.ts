import { prisma } from "@/lib/prisma";

import { expireDueOrders } from "./orders";

/** Detail pesanan milik pengguna (K.3). Pesanan yang lewat batas bayar ditandai dulu. */
export async function getOrderDetail(number: string, user: { id: string; role: string }) {
  const owner = await prisma.order.findUnique({ where: { number }, select: { userId: true, deletedAt: true } });
  if (!owner || owner.deletedAt || (owner.userId !== user.id && user.role !== "ADMIN")) return null;
  await expireDueOrders(owner.userId);
  return prisma.order.findUnique({
    where: { number },
    select: {
      number: true,
      status: true,
      subtotal: true,
      discount: true,
      total: true,
      createdAt: true,
      expiresAt: true,
      paidAt: true,
      voucher: { select: { code: true } },
      user: { select: { name: true, email: true, profile: { select: { phone: true } } } },
      items: { select: { productId: true, nameSnapshot: true, price: true, promoPrice: true, activeDays: true, product: { select: { slug: true } } } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { provider: true, method: true, status: true, vaNumber: true, qrString: true, rawResponse: true, paidAt: true, externalId: true },
      },
      enrollments: { select: { expiresAt: true, product: { select: { name: true } } } },
    },
  });
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;
