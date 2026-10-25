import { z } from "zod";

import { decimalField, intField, optionalDateTimeField, slugField } from "../form-rules";

// Form manajemen tryout (M.6). Field angka/tanggal berupa string di form.

const optionalDecimal = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => v === "" || /^-?\d+(\.\d+)?$/.test(v), `${label} harus angka`)
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (v >= min && v <= max), `${label} antara ${min} dan ${max}`);

export const examSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(5, "Nama tryout minimal 5 karakter").max(120, "Nama terlalu panjang"),
    slug: slugField,
    categoryId: z.string().min(1, "Pilih kategori"),
    description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(5000, "Deskripsi terlalu panjang"),
    rules: z.string().trim().max(5000, "Aturan terlalu panjang"),
    imageId: z.string().nullable(),
    durationMin: intField("Durasi", 1, 600),
    opensAt: optionalDateTimeField("Jadwal buka"),
    closesAt: optionalDateTimeField("Jadwal tutup"),
    maxAttempts: intField("Jumlah percobaan", 1, 100),
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
    showDiscussion: z.boolean(),
    discussionOpensAt: optionalDateTimeField("Waktu pembahasan dibuka"),
    correctScore: decimalField("Skor benar", 0, 100),
    wrongScore: decimalField("Skor salah", -100, 0),
    passingGrade: decimalField("Passing grade", 0, 100_000),
    status: z.enum(["DRAF", "TERBIT", "ARSIP"]),
  })
  .superRefine((v, ctx) => {
    if (v.opensAt && v.closesAt && v.closesAt <= v.opensAt) {
      ctx.addIssue({ code: "custom", path: ["closesAt"], message: "Jadwal tutup harus setelah jadwal buka" });
    }
  });

export type ExamInput = z.input<typeof examSchema>;
export type ExamOutput = z.output<typeof examSchema>;

export const sectionSchema = z.object({
  examId: z.string().min(1),
  id: z.string().optional(),
  title: z.string().trim().min(2, "Nama subtes minimal 2 karakter").max(80, "Nama subtes terlalu panjang"),
  durationMin: z
    .string()
    .trim()
    .regex(/^(\d+)?$/, "Durasi harus bilangan bulat")
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (v >= 1 && v <= 600), "Durasi subtes 1–600 menit"),
  weight: decimalField("Bobot subtes", 0.1, 100),
  passingGrade: optionalDecimal("Passing grade subtes", 0, 100_000),
});
export type SectionInput = z.input<typeof sectionSchema>;

export const idSchema = z.object({ id: z.string().min(1) });
export const moveSchema = z.object({ id: z.string().min(1), direction: z.enum(["naik", "turun"]) });
export const addQuestionsSchema = z.object({ sectionId: z.string().min(1), questionIds: z.array(z.string().min(1)).min(1, "Pilih minimal satu soal").max(200) });
export const questionWeightSchema = z.object({ id: z.string().min(1), weight: optionalDecimal("Bobot", 0.1, 100) });
export const reorderSchema = z.object({ sectionId: z.string().min(1), ids: z.array(z.string().min(1)).min(1) });

export const examFilterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]).optional().catch(undefined),
});
