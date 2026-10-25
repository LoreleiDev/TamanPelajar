// Harga, voucher, dan nomor pesanan (K.1) sebagai fungsi murni agar mudah diuji unit.
// Uang selalu Int rupiah.

export interface PricedItem {
  price: number;
  promoPrice: number | null;
}

/** Harga yang dibayar: harga promo bila lebih murah dari harga normal. */
export const effectivePrice = (i: PricedItem) => (i.promoPrice !== null && i.promoPrice < i.price ? i.promoPrice : i.price);

export function cartSubtotal(items: PricedItem[]) {
  return items.reduce((n, i) => n + effectivePrice(i), 0);
}

export interface VoucherRule {
  code: string;
  discountType: "PERSEN" | "NOMINAL";
  value: number;
  maxDiscount: number | null;
  minPurchase: number;
  quota: number | null;
  perUserLimit: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

export type VoucherCheck = { ok: true; discount: number } | { ok: false; error: string };

/**
 * Cek voucher terhadap subtotal dan pemakaian. `usedTotal` dan `usedByUser` menghitung
 * pemakaian pada pesanan yang belum gagal atau kedaluwarsa.
 */
export function evaluateVoucher(
  v: VoucherRule | null,
  ctx: { subtotal: number; now: Date; usedTotal: number; usedByUser: number },
): VoucherCheck {
  if (!v || !v.isActive) return { ok: false, error: "Kode voucher tidak ditemukan." };
  if (ctx.now < v.startsAt) return { ok: false, error: "Voucher ini belum berlaku." };
  if (ctx.now >= v.endsAt) return { ok: false, error: "Voucher ini sudah berakhir." };
  if (v.quota !== null && ctx.usedTotal >= v.quota) return { ok: false, error: "Kuota voucher ini sudah habis." };
  if (ctx.usedByUser >= v.perUserLimit) return { ok: false, error: "Kamu sudah memakai voucher ini." };
  if (ctx.subtotal < v.minPurchase) {
    return { ok: false, error: `Voucher ini berlaku untuk pembelian minimal ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v.minPurchase)}.` };
  }
  let discount = v.discountType === "PERSEN" ? Math.floor((ctx.subtotal * v.value) / 100) : v.value;
  if (v.maxDiscount !== null) discount = Math.min(discount, v.maxDiscount);
  discount = Math.max(0, Math.min(discount, ctx.subtotal));
  return { ok: true, discount };
}

/** Nomor pesanan TP-YYYYMMDD-XXXXXX menurut tanggal Jakarta; sufiks acak mencegah tebakan urut. */
export function orderNumber(now: Date, random: () => number = Math.random) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () => alphabet[Math.floor(random() * alphabet.length)]).join("");
  return `TP-${ymd}-${suffix}`;
}

const DAY = 86_400_000;

/**
 * Masa aktif setelah pembayaran (K.5): langganan yang masih aktif diperpanjang dari tanggal
 * berakhirnya, selain itu dihitung dari waktu bayar.
 */
export function extendEnrollment(current: { status: string; expiresAt: Date } | null, paidAt: Date, activeDays: number) {
  const stillActive = current && current.status === "AKTIF" && current.expiresAt > paidAt;
  const base = stillActive ? current.expiresAt : paidAt;
  return { startsAt: stillActive ? undefined : paidAt, expiresAt: new Date(base.getTime() + activeDays * DAY) };
}
