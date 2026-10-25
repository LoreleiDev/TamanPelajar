import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { enabledPayments, grossAmountMatches, mapTransactionStatus, verifySignature } from "./midtrans";

describe("webhook Midtrans", () => {
  const key = "SB-Mid-server-uji";
  const base = { order_id: "TP-20261025-ABCDEF", status_code: "200", gross_amount: "150000.00" };
  const sign = (p: typeof base, k = key) => createHash("sha512").update(p.order_id + p.status_code + p.gross_amount + k).digest("hex");

  it("signature yang benar diterima; yang diubah atau kunci lain ditolak", () => {
    expect(verifySignature({ ...base, signature_key: sign(base) }, key)).toBe(true);
    expect(verifySignature({ ...base, gross_amount: "1.00", signature_key: sign(base) }, key)).toBe(false);
    expect(verifySignature({ ...base, signature_key: sign(base, "kunci-lain") }, key)).toBe(false);
    expect(verifySignature({ ...base }, key)).toBe(false);
    expect(verifySignature({ ...base, signature_key: 123 }, key)).toBe(false);
  });

  it("status transaksi dipetakan ke status pesanan", () => {
    expect(mapTransactionStatus("settlement")).toBe("BERHASIL");
    expect(mapTransactionStatus("capture", "accept")).toBe("BERHASIL");
    expect(mapTransactionStatus("capture", "challenge")).toBeNull();
    expect(mapTransactionStatus("pending")).toBe("MENUNGGU");
    expect(mapTransactionStatus("deny")).toBe("GAGAL");
    expect(mapTransactionStatus("expire")).toBe("KEDALUWARSA");
    expect(mapTransactionStatus("refund")).toBe("DIKEMBALIKAN");
    expect(mapTransactionStatus("authorize")).toBeNull();
  });

  it("nominal dan saluran pembayaran", () => {
    expect(grossAmountMatches("150000.00", 150_000)).toBe(true);
    expect(grossAmountMatches("149999.00", 150_000)).toBe(false);
    expect(enabledPayments("VIRTUAL_ACCOUNT", "bni")).toEqual(["bni_va"]);
    expect(enabledPayments("VIRTUAL_ACCOUNT", "mandiri")).toEqual(["echannel"]);
    expect(enabledPayments("QRIS")).toEqual(["other_qris"]);
  });
});
