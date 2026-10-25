import { z } from "zod";

import { dateTimeField, intField, optionalIntField } from "../form-rules";

// Form voucher (C.2.7). Field angka dan tanggal berupa string di form, diubah oleh Zod.
export const voucherSchema = z
  .object({
    id: z.string().optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Kode minimal 3 karakter")
      .max(30, "Kode maksimal 30 karakter")
      .regex(/^[A-Z0-9-]+$/, "Kode hanya huruf, angka, dan tanda hubung"),
    description: z.string().trim().min(3, "Keterangan minimal 3 karakter").max(180, "Keterangan terlalu panjang"),
    discountType: z.enum(["PERSEN", "NOMINAL"], { error: "Pilih jenis potongan" }),
    value: intField("Nilai potongan", 1, 10_000_000),
    maxDiscount: optionalIntField("Potongan maksimal", 1000, 10_000_000),
    minPurchase: intField("Minimum belanja", 0, 100_000_000),
    quota: optionalIntField("Kuota", 1, 1_000_000),
    perUserLimit: intField("Batas per pengguna", 1, 100),
    startsAt: dateTimeField("Mulai berlaku"),
    endsAt: dateTimeField("Berakhir"),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.discountType === "PERSEN" && v.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "Potongan persen maksimal 100" });
    if (v.discountType === "NOMINAL" && v.maxDiscount !== null) {
      ctx.addIssue({ code: "custom", path: ["maxDiscount"], message: "Potongan maksimal hanya untuk jenis persen; kosongkan" });
    }
    if (v.endsAt <= v.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Waktu berakhir harus setelah waktu mulai" });
  });

export type VoucherInput = z.input<typeof voucherSchema>;
export type VoucherOutput = z.output<typeof voucherSchema>;

export const voucherIdSchema = z.object({ id: z.string().min(1) });
export const voucherToggleSchema = z.object({ id: z.string().min(1), active: z.boolean() });

export type VoucherState = "aktif" | "nonaktif" | "belum-mulai" | "berakhir" | "kuota-habis";

/** Keadaan voucher saat ini untuk label daftar. */
export function voucherState(v: { isActive: boolean; startsAt: Date; endsAt: Date; quota: number | null }, used: number, now = new Date()): VoucherState {
  if (!v.isActive) return "nonaktif";
  if (now < v.startsAt) return "belum-mulai";
  if (now > v.endsAt) return "berakhir";
  if (v.quota !== null && used >= v.quota) return "kuota-habis";
  return "aktif";
}
