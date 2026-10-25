import { prisma } from "@/lib/prisma";

import { effectivePrice } from "@/features/payment/pricing";

// Keranjang (K.1). Paket yang sudah tidak terbit tetap tampil dengan tanda agar pengguna
// tahu kenapa checkout ditolak.

export async function getCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              price: true,
              promoPrice: true,
              activeDays: true,
              status: true,
              deletedAt: true,
              category: { select: { name: true } },
              enrollments: { where: { userId, status: "AKTIF", expiresAt: { gt: new Date() } }, select: { expiresAt: true } },
            },
          },
        },
      },
    },
  });
  const items = (cart?.items ?? []).map(({ product: p }) => ({
    productId: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category.name,
    price: p.price,
    promoPrice: p.promoPrice,
    payPrice: effectivePrice(p),
    activeDays: p.activeDays,
    available: p.status === "TERBIT" && !p.deletedAt,
    activeUntil: p.enrollments[0]?.expiresAt ?? null,
  }));
  return { items, subtotal: items.filter((i) => i.available).reduce((n, i) => n + i.payPrice, 0) };
}

export type CartView = Awaited<ReturnType<typeof getCart>>;

export async function cartCount(userId: string) {
  return prisma.cartItem.count({ where: { cart: { userId } } });
}
