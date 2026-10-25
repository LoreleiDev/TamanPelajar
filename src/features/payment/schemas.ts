import { z } from "zod";

import { VA_BANKS } from "@/lib/midtrans";

const code = z
  .string()
  .trim()
  .max(40, "Kode voucher terlalu panjang")
  .regex(/^[A-Za-z0-9-]*$/, "Kode voucher hanya berisi huruf, angka, dan tanda hubung");

export const voucherSchema = z.object({ code: code.min(1, "Masukkan kode voucher") });

export const checkoutSchema = z
  .object({
    voucherCode: code.nullable(),
    method: z.enum(["VIRTUAL_ACCOUNT", "QRIS", "E_WALLET", "TRANSFER_BANK"], { error: "Pilih metode pembayaran." }),
    bank: z.enum(VA_BANKS).optional(),
    expectedTotal: z.number().int().min(0),
  })
  .refine((v) => v.method !== "VIRTUAL_ACCOUNT" || v.bank, { message: "Pilih bank untuk virtual account.", path: ["bank"] });

export const orderNumberSchema = z.object({ number: z.string().regex(/^TP-\d{8}-[A-Z0-9]{4,8}$/, "Nomor pesanan tidak valid") });

export const simulateSchema = orderNumberSchema.extend({ outcome: z.enum(["BERHASIL", "GAGAL"]) });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
