import { z } from "zod";

// Pengaturan situs (M.1 Pengaturan).

export const faqSettingSchema = z.object({
  items: z
    .array(
      z.object({
        question: z.string().trim().min(5, "Pertanyaan minimal 5 karakter").max(200, "Pertanyaan terlalu panjang"),
        answer: z.string().trim().min(5, "Jawaban minimal 5 karakter").max(1000, "Jawaban terlalu panjang"),
      }),
    )
    .min(1, "Isi minimal satu pertanyaan")
    .max(12, "Maksimal 12 pertanyaan"),
});
export type FaqSettingInput = z.input<typeof faqSettingSchema>;

export const contactSettingSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Format email belum benar")),
  jamLayanan: z.string().trim().min(5, "Jam layanan wajib diisi").max(120, "Jam layanan terlalu panjang"),
});
export type ContactSettingInput = z.input<typeof contactSettingSchema>;
