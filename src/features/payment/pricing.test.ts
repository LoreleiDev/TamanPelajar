import { describe, expect, it } from "vitest";

import { cartSubtotal, effectivePrice, evaluateVoucher, extendEnrollment, orderNumber, type VoucherRule } from "./pricing";

const now = new Date("2026-10-25T03:00:00Z");
const base: VoucherRule = {
  code: "HEMAT10",
  discountType: "PERSEN",
  value: 10,
  maxDiscount: 50_000,
  minPurchase: 0,
  quota: 100,
  perUserLimit: 1,
  startsAt: new Date("2026-10-01T00:00:00Z"),
  endsAt: new Date("2026-12-01T00:00:00Z"),
  isActive: true,
};
const ctx = { subtotal: 300_000, now, usedTotal: 0, usedByUser: 0 };

describe("harga (K.1)", () => {
  it("harga promo dipakai hanya bila lebih murah", () => {
    expect(effectivePrice({ price: 200_000, promoPrice: 150_000 })).toBe(150_000);
    expect(effectivePrice({ price: 200_000, promoPrice: 250_000 })).toBe(200_000);
    expect(cartSubtotal([{ price: 100_000, promoPrice: null }, { price: 200_000, promoPrice: 150_000 }])).toBe(250_000);
  });
});

describe("voucher (K.1)", () => {
  it("persen dibatasi potongan maksimal; nominal tidak melebihi subtotal", () => {
    expect(evaluateVoucher(base, ctx)).toEqual({ ok: true, discount: 30_000 });
    expect(evaluateVoucher(base, { ...ctx, subtotal: 900_000 })).toEqual({ ok: true, discount: 50_000 });
    const nominal = { ...base, discountType: "NOMINAL" as const, value: 25_000, maxDiscount: null };
    expect(evaluateVoucher(nominal, { ...ctx, subtotal: 20_000 })).toEqual({ ok: true, discount: 20_000 });
  });

  it("menolak voucher tidak aktif, di luar jadwal, kuota habis, sudah dipakai, atau di bawah minimum", () => {
    expect(evaluateVoucher(null, ctx).ok).toBe(false);
    expect(evaluateVoucher({ ...base, isActive: false }, ctx).ok).toBe(false);
    expect(evaluateVoucher(base, { ...ctx, now: new Date("2026-09-01T00:00:00Z") })).toMatchObject({ error: "Voucher ini belum berlaku." });
    expect(evaluateVoucher(base, { ...ctx, now: base.endsAt })).toMatchObject({ error: "Voucher ini sudah berakhir." });
    expect(evaluateVoucher(base, { ...ctx, usedTotal: 100 })).toMatchObject({ error: "Kuota voucher ini sudah habis." });
    expect(evaluateVoucher(base, { ...ctx, usedByUser: 1 })).toMatchObject({ error: "Kamu sudah memakai voucher ini." });
    const r = evaluateVoucher({ ...base, minPurchase: 400_000 }, ctx);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/minimal Rp\s?400\.000/);
  });
});

describe("nomor pesanan dan masa aktif", () => {
  it("nomor memakai tanggal Jakarta", () => {
    expect(orderNumber(new Date("2026-10-24T18:30:00Z"), () => 0)).toBe("TP-20261025-AAAAAA");
  });

  it("langganan aktif diperpanjang dari tanggal berakhir; yang kedaluwarsa dihitung ulang dari waktu bayar", () => {
    const active = { status: "AKTIF", expiresAt: new Date("2026-11-01T00:00:00Z") };
    expect(extendEnrollment(active, now, 30)).toEqual({ startsAt: undefined, expiresAt: new Date("2026-12-01T00:00:00Z") });
    const expired = { status: "AKTIF", expiresAt: new Date("2026-10-01T00:00:00Z") };
    expect(extendEnrollment(expired, now, 30)).toEqual({ startsAt: now, expiresAt: new Date(now.getTime() + 30 * 86_400_000) });
    expect(extendEnrollment(null, now, 1).startsAt).toEqual(now);
  });
});
