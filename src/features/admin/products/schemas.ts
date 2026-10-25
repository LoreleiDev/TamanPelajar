import { z } from "zod";

import { intField, optionalIntField, slugField } from "../form-rules";

// Form paket produk (M.4): nama, kategori, deskripsi, thumbnail, harga, harga promo,
// masa aktif, status, fitur, FAQ, serta kelas, tryout, dan video yang termasuk.

export const PROGRAM_TYPES = ["KELAS", "TRYOUT", "BUNDEL"] as const;
export const programTypeLabel = { KELAS: "Kelas", TRYOUT: "Tryout", BUNDEL: "Bundel kelas + tryout" } as const;

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(3, "Nama paket minimal 3 karakter").max(120, "Nama terlalu panjang"),
    slug: slugField,
    categoryId: z.string().min(1, "Pilih program"),
    programType: z.enum(PROGRAM_TYPES),
    educationLevel: z.enum(["SMP", "SMA", "SMK", "D3", "S1", "S2", "UMUM"]),
    summary: z.string().trim().min(10, "Ringkasan minimal 10 karakter").max(500, "Ringkasan maksimal 500 karakter"),
    description: z.string().trim().min(20, "Deskripsi minimal 20 karakter").max(10_000, "Deskripsi terlalu panjang"),
    thumbnailId: z.string().nullable(),
    price: intField("Harga", 0, 100_000_000),
    promoPrice: optionalIntField("Harga promo", 0, 100_000_000),
    activeDays: intField("Masa aktif", 1, 3650),
    features: z
      .string()
      .transform((v) =>
        v
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.string().max(160, "Satu fitur maksimal 160 karakter")).min(1, "Tulis minimal satu fitur").max(12, "Maksimal 12 fitur")),
    faq: z
      .array(z.object({ question: z.string().trim().max(200, "Pertanyaan terlalu panjang"), answer: z.string().trim().max(1000, "Jawaban terlalu panjang") }))
      .max(10, "Maksimal 10 pertanyaan")
      .transform((items) => items.filter((i) => i.question || i.answer)),
    status: z.enum(["DRAF", "TERBIT", "ARSIP"]),
    courseIds: z.array(z.string()),
    examIds: z.array(z.string()),
    videoIds: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    if (v.promoPrice !== null && v.promoPrice >= v.price) ctx.addIssue({ code: "custom", path: ["promoPrice"], message: "Harga promo harus lebih kecil dari harga normal" });
    if (v.faq.some((i) => !i.question || !i.answer)) ctx.addIssue({ code: "custom", path: ["faq"], message: "Setiap FAQ butuh pertanyaan dan jawaban" });
    if (v.status === "TERBIT" && v.courseIds.length + v.examIds.length + v.videoIds.length === 0) {
      ctx.addIssue({ code: "custom", path: ["status"], message: "Paket terbit harus memuat minimal satu kelas, tryout, atau video" });
    }
  });

export type ProductInput = z.input<typeof productSchema>;
