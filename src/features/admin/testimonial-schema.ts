import { z } from "zod";

import { intField } from "./form-rules";

// Testimoni beranda (D.1.7, M.1). Ditulis wajar, bukan bernada iklan (CLAUDE.md "Desain anti-generik").
export const testimonialSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60, "Nama terlalu panjang"),
  program: z.string().trim().min(2, "Program wajib diisi").max(80, "Program terlalu panjang"),
  opening: z.string().trim().min(5, "Kalimat pembuka minimal 5 karakter").max(160, "Kalimat pembuka maksimal 160 karakter"),
  body: z.string().trim().min(20, "Isi minimal 20 karakter").max(1200, "Isi maksimal 1.200 karakter"),
  isPublished: z.boolean(),
  order: intField("Urutan", 0, 999),
});
export type TestimonialInput = z.input<typeof testimonialSchema>;
