import { z } from "zod";

import { intField } from "./form-rules";

// Mata pelajaran (revisi RMED): daftar yang dipilih di form kelas, video, dan bank soal.
export const subjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama terlalu panjang"),
  order: intField("Urutan", 0, 999),
});
export type SubjectInput = z.input<typeof subjectSchema>;

/** Field form: nama mata pelajaran dari daftar admin (divalidasi ulang di server). */
export const subjectField = z.string().trim().min(1, "Pilih mata pelajaran").max(80, "Mata pelajaran terlalu panjang");
