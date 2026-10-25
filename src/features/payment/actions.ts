"use server";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { paymentMode } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { formatRetry, rateLimit } from "@/lib/rate-limit";
import { AuthorizationError, requireRole } from "@/lib/rbac";

import { getCart } from "@/features/cart/queries";

import { applyPaymentStatus, createOrder, OrderError, previewVoucher } from "./orders";
import { checkoutSchema, orderNumberSchema, simulateSchema, voucherSchema } from "./schemas";

// Server action checkout dan pembayaran (K.1–K.2). Harga dan voucher selalu dihitung ulang
// di server; angka dari client hanya dipakai untuk mendeteksi perubahan harga.

async function session() {
  try {
    return { user: await requireRole() } as const;
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) } as const;
    throw e;
  }
}

/** Pratinjau potongan voucher terhadap isi keranjang saat ini. */
export async function cekVoucher(input: unknown): Promise<ActionResult<{ code: string; discount: number; total: number; description: string }>> {
  const s = await session();
  if (s.error) return s.error;
  const parsed = voucherSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const limit = await rateLimit(`voucher:${s.user.id}`, 20, 60);
  if (!limit.allowed) return fail(`Terlalu banyak percobaan kode. Coba lagi dalam ${formatRetry(limit.retryAfterSec)}.`);
  const cart = await getCart(s.user.id);
  if (cart.items.length === 0) return fail("Keranjangmu kosong.");
  const { voucher, check } = await previewVoucher(s.user.id, parsed.data.code, cart.subtotal);
  if (!check.ok) return fail(check.error);
  return ok({ code: voucher!.code, discount: check.discount, total: cart.subtotal - check.discount, description: voucher!.description });
}

/** Buat pesanan dan pembayaran, lalu arahkan ke halaman transaksi (K.1). */
export async function buatPesanan(input: unknown): Promise<ActionResult<{ number: string }>> {
  const s = await session();
  if (s.error) return s.error;
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const limit = await rateLimit(`checkout:${s.user.id}`, 5, 60);
  if (!limit.allowed) return fail(`Terlalu banyak percobaan checkout. Coba lagi dalam ${formatRetry(limit.retryAfterSec)}.`);
  try {
    const order = await createOrder(s.user, {
      voucherCode: parsed.data.voucherCode || null,
      method: parsed.data.method,
      bank: parsed.data.bank,
      expectedTotal: parsed.data.expectedTotal,
    });
    return ok({ number: order.number });
  } catch (e) {
    if (e instanceof OrderError) return fail(e.message);
    throw e;
  }
}

async function ownOrder(userId: string, number: string) {
  return prisma.order.findFirst({
    where: { number, userId, deletedAt: null },
    select: { id: true, status: true, expiresAt: true, payments: { orderBy: { createdAt: "desc" }, take: 1, select: { provider: true } } },
  });
}

/** Mode simulasi (K.2.5): tandai pembayaran berhasil atau gagal tanpa penyedia asli. */
export async function simulasiBayar(input: unknown): Promise<ActionResult<{ status: string }>> {
  const s = await session();
  if (s.error) return s.error;
  const parsed = simulateSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  if (paymentMode() !== "simulasi") return fail("Simulasi pembayaran tidak tersedia.");
  const order = await ownOrder(s.user.id, parsed.data.number);
  if (!order) return fail("Pesanan tidak ditemukan.");
  if (order.payments[0]?.provider !== "simulasi") return fail("Pesanan ini tidak memakai pembayaran simulasi.");
  if (order.status !== "MENUNGGU") return fail("Pesanan ini sudah tidak menunggu pembayaran.");
  if (order.expiresAt <= new Date()) {
    await applyPaymentStatus(order.id, "KEDALUWARSA");
    return fail("Batas waktu pembayaran sudah lewat.");
  }
  await applyPaymentStatus(order.id, parsed.data.outcome);
  return ok({ status: parsed.data.outcome });
}

/** Batalkan pesanan yang belum dibayar; kuota voucher dikembalikan. */
export async function batalkanPesanan(input: unknown): Promise<ActionResult<null>> {
  const s = await session();
  if (s.error) return s.error;
  const parsed = orderNumberSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const order = await ownOrder(s.user.id, parsed.data.number);
  if (!order) return fail("Pesanan tidak ditemukan.");
  if (order.status !== "MENUNGGU") return fail("Hanya pesanan yang menunggu pembayaran yang bisa dibatalkan.");
  await applyPaymentStatus(order.id, "GAGAL");
  return ok(null);
}
