import type { PaymentMethodCode, VaBank } from "@/lib/midtrans";
import { getPaymentProvider } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

import { effectivePrice, evaluateVoucher, extendEnrollment, orderNumber } from "./pricing";

// Siklus hidup pesanan (K.1, K.5). Aktivasi paket hanya terjadi di activateOrder(), dari
// status BERHASIL, dan idempoten: webhook ganda, klik ganda, atau simulasi dan webhook yang
// datang bersamaan hanya membuat satu aktivasi.

const PAY_WINDOW_MS = 24 * 3600_000;
type Status = "MENUNGGU" | "BERHASIL" | "GAGAL" | "KEDALUWARSA" | "DIKEMBALIKAN";

export class OrderError extends Error {}

/** Pemakaian voucher yang masih dihitung: pesanan yang belum gagal atau kedaluwarsa. */
async function voucherUsage(tx: Pick<typeof prisma, "voucherUsage">, voucherId: string, userId: string) {
  const [usedTotal, usedByUser] = await Promise.all([
    tx.voucherUsage.count({ where: { voucherId } }),
    tx.voucherUsage.count({ where: { voucherId, userId } }),
  ]);
  return { usedTotal, usedByUser };
}

/** Pratinjau voucher di halaman checkout; aturan sama persis dengan saat pesanan dibuat. */
export async function previewVoucher(userId: string, code: string, subtotal: number) {
  const voucher = await prisma.voucher.findUnique({ where: { code: code.trim().toUpperCase() } });
  const used = voucher ? await voucherUsage(prisma, voucher.id, userId) : { usedTotal: 0, usedByUser: 0 };
  return { voucher, check: evaluateVoucher(voucher, { subtotal, now: new Date(), ...used }) };
}

/**
 * Buat pesanan dari keranjang: harga di-snapshot, voucher dikunci (SELECT ... FOR UPDATE)
 * agar kuota tidak terlampaui oleh checkout bersamaan, lalu keranjang dikosongkan.
 */
export async function createOrder(
  user: { id: string; name: string; email: string },
  input: { voucherCode: string | null; method: PaymentMethodCode; bank?: VaBank; expectedTotal: number },
) {
  const now = new Date();
  const voucherCode = input.voucherCode ? input.voucherCode.trim().toUpperCase() : null;
  const order = await prisma.$transaction(async (tx) => {
    // Kunci baris keranjang dan voucher SEBELUM pembacaan biasa pertama. Di InnoDB (REPEATABLE
    // READ) snapshot transaksi diambil pada pembacaan biasa pertama; bila kunci didapat
    // sesudahnya, hitungan kuota dan isi keranjang bisa membaca data basi. Urutan kunci tetap
    // (keranjang lalu voucher) mencegah deadlock. Checkout ganda dari dua tab menunggu di sini
    // lalu mendapati keranjang sudah kosong.
    await tx.$queryRaw`SELECT id FROM \`Cart\` WHERE userId = ${user.id} FOR UPDATE`;
    if (voucherCode) await tx.$queryRaw`SELECT id FROM \`Voucher\` WHERE code = ${voucherCode} FOR UPDATE`;
    const cart = await tx.cart.findUnique({
      where: { userId: user.id },
      select: {
        items: {
          orderBy: { createdAt: "asc" },
          select: { product: { select: { id: true, name: true, price: true, promoPrice: true, activeDays: true, status: true, deletedAt: true } } },
        },
      },
    });
    const products = (cart?.items ?? []).map((i) => i.product).filter((p) => p.status === "TERBIT" && !p.deletedAt);
    if (products.length === 0) throw new OrderError("Keranjangmu kosong.");
    if (products.length !== cart!.items.length) throw new OrderError("Ada paket di keranjang yang sudah tidak dijual. Hapus dulu dari keranjang.");
    const subtotal = products.reduce((n, p) => n + effectivePrice(p), 0);

    let voucherId: string | null = null;
    let discount = 0;
    if (voucherCode) {
      const voucher = await tx.voucher.findUnique({ where: { code: voucherCode } });
      const used = voucher ? await voucherUsage(tx, voucher.id, user.id) : { usedTotal: 0, usedByUser: 0 };
      const check = evaluateVoucher(voucher, { subtotal, now, ...used });
      if (!check.ok) throw new OrderError(check.error);
      voucherId = voucher!.id;
      discount = check.discount;
    }
    const total = subtotal - discount;
    // Harga berubah sejak halaman checkout dibuka: minta pengguna memeriksa ulang.
    if (total !== input.expectedTotal) throw new OrderError("Total pesanan berubah. Periksa ulang ringkasan pesanan sebelum membayar.");

    const created = await tx.order.create({
      data: {
        number: orderNumber(now),
        userId: user.id,
        subtotal,
        discount,
        total,
        voucherId,
        expiresAt: new Date(now.getTime() + PAY_WINDOW_MS),
        items: {
          create: products.map((p) => ({ productId: p.id, nameSnapshot: p.name, price: p.price, promoPrice: p.promoPrice, activeDays: p.activeDays })),
        },
        ...(voucherId ? { voucherUsage: { create: { voucherId, userId: user.id } } } : {}),
      },
      select: { id: true, number: true, total: true, discount: true, createdAt: true, expiresAt: true, items: { select: { productId: true, nameSnapshot: true, price: true, promoPrice: true } } },
    });
    await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
    return created;
  });

  // Pesanan gratis (voucher menutup seluruh harga) langsung aktif tanpa penyedia pembayaran.
  if (order.total === 0) {
    await prisma.payment.create({ data: { orderId: order.id, provider: "gratis", method: input.method, status: "MENUNGGU", externalId: `FREE-${order.number}` } });
    await activateOrder(order.id);
    return order;
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { phone: true } });
  try {
    const payment = await getPaymentProvider().createPayment({
      orderNumber: order.number,
      total: order.total,
      discount: order.discount,
      items: order.items.map((i) => ({ id: i.productId, name: i.nameSnapshot, price: effectivePrice(i) })),
      customer: { name: user.name, email: user.email, phone: profile?.phone },
      method: input.method,
      bank: input.bank,
      createdAt: order.createdAt,
      expiresAt: order.expiresAt,
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: payment.provider,
        method: input.method,
        externalId: payment.externalId,
        snapToken: payment.snapToken,
        vaNumber: payment.vaNumber,
        qrString: payment.qrString,
        rawResponse: { bank: input.bank ?? null, redirectUrl: payment.redirectUrl ?? null },
      },
    });
  } catch (e) {
    // Penyedia menolak: batalkan pesanan agar voucher dan keranjang tidak hilang percuma.
    await applyPaymentStatus(order.id, "GAGAL");
    await restoreCart(user.id, order.items.map((i) => i.productId));
    console.error("Gagal membuat pembayaran", e);
    throw new OrderError("Penyedia pembayaran sedang tidak bisa dihubungi. Coba lagi beberapa saat lagi.");
  }
  return order;
}

async function restoreCart(userId: string, productIds: string[]) {
  const cart = await prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, select: { id: true } });
  await prisma.cartItem.createMany({ data: productIds.map((productId) => ({ cartId: cart.id, productId })), skipDuplicates: true });
}

/**
 * Aktifkan paket untuk pesanan yang dibayar (K.5). Klaim status lewat updateMany bersyarat
 * di dalam transaksi; hanya pemanggil yang berhasil mengklaim yang membuat Enrollment.
 * `from` = status asal yang boleh diaktifkan (webhook Midtrans yang terverifikasi boleh
 * mengaktifkan pesanan yang sempat ditandai kedaluwarsa, karena uangnya sudah diterima).
 */
export async function activateOrder(orderId: string, opts: { from?: Status[]; paidAt?: Date; raw?: unknown } = {}) {
  const paidAt = opts.paidAt ?? new Date();
  const from = opts.from ?? ["MENUNGGU"];
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({ where: { id: orderId, status: { in: from } }, data: { status: "BERHASIL", paidAt } });
    if (claimed.count === 0) return false;
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { userId: true, number: true, voucherId: true, voucherUsage: { select: { id: true } }, items: { select: { productId: true, activeDays: true, nameSnapshot: true } } },
    });
    for (const item of order.items) {
      // Pembacaan terkunci: dua pesanan produk sama yang dibayar bersamaan tidak saling
      // menimpa perpanjangan masa aktif.
      const [current] = await tx.$queryRaw<{ status: string; expiresAt: Date }[]>`
        SELECT status, expiresAt FROM \`Enrollment\` WHERE userId = ${order.userId} AND productId = ${item.productId} FOR UPDATE`;
      // $queryRaw bisa mengembalikan DATETIME sebagai string; normalkan ke Date.
      const next = extendEnrollment(current ? { status: current.status, expiresAt: new Date(current.expiresAt) } : null, paidAt, item.activeDays);
      await tx.enrollment.upsert({
        where: { userId_productId: { userId: order.userId, productId: item.productId } },
        create: { userId: order.userId, productId: item.productId, orderId, startsAt: paidAt, expiresAt: next.expiresAt },
        update: { orderId, status: "AKTIF", expiresAt: next.expiresAt, ...(next.startsAt ? { startsAt: next.startsAt } : {}) },
      });
      await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: 1 } } });
    }
    if (order.voucherId && !order.voucherUsage) {
      await tx.voucherUsage.create({ data: { voucherId: order.voucherId, userId: order.userId, orderId } });
    }
    const latest = await tx.payment.findFirst({ where: { orderId }, orderBy: { createdAt: "desc" }, select: { id: true } });
    if (latest) {
      await tx.payment.update({
        where: { id: latest.id },
        data: { status: "BERHASIL", paidAt, ...(opts.raw ? { rawResponse: opts.raw as object } : {}) },
      });
    }
    await tx.notification.create({
      data: {
        userId: order.userId,
        type: "TRANSAKSI",
        title: "Pembayaran berhasil",
        body: `${order.items.map((i) => i.nameSnapshot).join(", ")} sudah aktif. Selamat belajar.`,
        href: `/transaksi/${order.number}`,
      },
    });
    return true;
  });
}

/** Satu pintu perubahan status dari simulasi, webhook, atau kedaluwarsa. */
export async function applyPaymentStatus(orderId: string, status: Status, opts: { from?: Status[]; raw?: unknown } = {}) {
  if (status === "MENUNGGU") return false;
  if (status === "BERHASIL") return activateOrder(orderId, { from: opts.from, raw: opts.raw });
  if (status === "DIKEMBALIKAN") {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({ where: { id: orderId, status: "BERHASIL" }, data: { status: "DIKEMBALIKAN" } });
      if (claimed.count === 0) return false;
      await tx.enrollment.updateMany({ where: { orderId }, data: { status: "DIBATALKAN" } });
      // Penjualan yang dikembalikan tidak dihitung sebagai program terlaris (M.2.3).
      const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true } });
      for (const i of items) await tx.product.updateMany({ where: { id: i.productId, salesCount: { gt: 0 } }, data: { salesCount: { decrement: 1 } } });
      await tx.payment.updateMany({ where: { orderId, status: "BERHASIL" }, data: { status: "DIKEMBALIKAN" } });
      return true;
    });
  }
  // GAGAL atau KEDALUWARSA: hanya dari MENUNGGU; kuota voucher dikembalikan.
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({ where: { id: orderId, status: "MENUNGGU" }, data: { status } });
    if (claimed.count === 0) return false;
    await tx.voucherUsage.deleteMany({ where: { orderId } });
    await tx.payment.updateMany({ where: { orderId, status: "MENUNGGU" }, data: { status, ...(opts.raw ? { rawResponse: opts.raw as object } : {}) } });
    return true;
  });
}

/** Tandai pesanan yang lewat batas bayar sebagai kedaluwarsa (dipanggil saat halaman dibuka). */
export async function expireDueOrders(userId?: string) {
  // Tanpa userId (panel admin): semua pesanan yang lewat batas bayar.
  const due = await prisma.order.findMany({ where: { ...(userId && { userId }), status: "MENUNGGU", expiresAt: { lte: new Date() } }, select: { id: true } });
  for (const o of due) await applyPaymentStatus(o.id, "KEDALUWARSA");
}
