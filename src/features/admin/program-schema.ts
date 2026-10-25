import { z } from "zod";

import { intField, slugField } from "./form-rules";

// Program = kategori ujian (CourseCategory, D.1.3, M.1): dipakai kelas, video, tryout, paket, dan soal.

export const programSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(80, "Nama terlalu panjang"),
  shortName: z.string().trim().min(2, "Nama singkat minimal 2 karakter").max(20, "Nama singkat maksimal 20 karakter"),
  slug: slugField,
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(2000, "Deskripsi terlalu panjang"),
  audience: z.string().trim().min(3, "Sasaran peserta wajib diisi").max(120, "Sasaran terlalu panjang"),
  order: intField("Urutan", 0, 999),
});
export type ProgramInput = z.input<typeof programSchema>;
