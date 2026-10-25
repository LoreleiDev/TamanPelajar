"use server";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { formatRetry, rateLimit } from "@/lib/rate-limit";
import { AuthorizationError, requireRole } from "@/lib/rbac";

import { addToCartSchema, removeFromCartSchema } from "./schemas";

const MAX_ITEMS = 10;

async function session() {
  try {
    return { user: await requireRole() } as const;
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) } as const;
    throw e;
  }
}

/** Tambah paket ke keranjang (K.1). Menambah paket yang sama dua kali tidak menggandakan. */
export async function tambahKeKeranjang(input: unknown): Promise<ActionResult<{ count: number }>> {
  const s = await session();
  if (s.error) return s.error;
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const limit = await rateLimit(`keranjang:${s.user.id}`, 30, 60);
  if (!limit.allowed) return fail(`Terlalu banyak permintaan. Coba lagi dalam ${formatRetry(limit.retryAfterSec)}.`);

  const product = await prisma.product.findFirst({ where: { slug: parsed.data.slug, status: "TERBIT", deletedAt: null }, select: { id: true } });
  if (!product) return fail("Paket tidak ditemukan atau sudah tidak dijual.");
  const cart = await prisma.cart.upsert({ where: { userId: s.user.id }, create: { userId: s.user.id }, update: {}, select: { id: true } });
  const count = await prisma.cartItem.count({ where: { cartId: cart.id } });
  const exists = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId: product.id } }, select: { id: true } });
  if (!exists && count >= MAX_ITEMS) return fail(`Keranjang maksimal ${MAX_ITEMS} paket.`);
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    create: { cartId: cart.id, productId: product.id },
    update: {},
  });
  return ok({ count: exists ? count : count + 1 });
}

export async function hapusDariKeranjang(input: unknown): Promise<ActionResult<null>> {
  const s = await session();
  if (s.error) return s.error;
  const parsed = removeFromCartSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  await prisma.cartItem.deleteMany({ where: { productId: parsed.data.productId, cart: { userId: s.user.id } } });
  return ok(null);
}
