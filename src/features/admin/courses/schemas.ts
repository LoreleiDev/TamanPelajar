import { z } from "zod";

import { intField, slugField } from "../form-rules";

// Form kelas, bab, dan materi (L.2.1–L.2.5, L.2.10).

export const LESSON_TYPES = ["VIDEO", "PDF", "TEKS", "KUIS", "TUGAS"] as const;
export type LessonTypeCode = (typeof LESSON_TYPES)[number];
export const lessonTypeLabel: Record<LessonTypeCode, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  TEKS: "Bacaan",
  KUIS: "Kuis",
  TUGAS: "Tugas",
};

export const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(120, "Judul terlalu panjang"),
  slug: slugField,
  summary: z.string().trim().min(10, "Ringkasan minimal 10 karakter").max(500, "Ringkasan maksimal 500 karakter"),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(10_000, "Deskripsi terlalu panjang"),
  categoryId: z.string().min(1, "Pilih program"),
  subject: z.string().trim().min(2, "Mata pelajaran wajib diisi").max(80, "Mata pelajaran terlalu panjang"),
  level: z.enum(["MUDAH", "SEDANG", "SULIT"]),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]),
  sequentialLock: z.boolean(),
  thumbnailId: z.string().nullable(),
  certificate: z.boolean(),
});
export type CourseInput = z.input<typeof courseSchema>;

export const sectionCreateSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2, "Judul bab minimal 2 karakter").max(120, "Judul bab terlalu panjang"),
});
export const sectionUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2, "Judul bab minimal 2 karakter").max(120, "Judul bab terlalu panjang"),
  isFree: z.boolean(),
});
export const reorderSchema = z.object({ parentId: z.string().min(1), ids: z.array(z.string().min(1)).min(1).max(500) });

export const lessonCreateSchema = z.object({
  sectionId: z.string().min(1),
  title: z.string().trim().min(2, "Judul materi minimal 2 karakter").max(150, "Judul terlalu panjang"),
  type: z.enum(LESSON_TYPES),
});

export const lessonSchema = z
  .object({
    id: z.string().min(1),
    sectionId: z.string().min(1, "Pilih bab"),
    title: z.string().trim().min(2, "Judul materi minimal 2 karakter").max(150, "Judul terlalu panjang"),
    slug: slugField,
    summary: z.string().trim().max(500, "Ringkasan maksimal 500 karakter"),
    type: z.enum(LESSON_TYPES),
    content: z.string().trim().max(200_000, "Isi terlalu panjang"),
    videoId: z.string(),
    durationMin: z
      .string()
      .trim()
      .regex(/^(\d+)?$/, "Durasi harus bilangan bulat menit")
      .transform((v) => (v === "" ? null : Number(v)))
      .refine((v) => v === null || v <= 600, "Durasi maksimal 600 menit"),
  })
  .superRefine((v, ctx) => {
    if (v.type === "VIDEO" && !v.videoId) ctx.addIssue({ code: "custom", path: ["videoId"], message: "Pilih video dari pustaka" });
    if ((v.type === "TEKS" || v.type === "TUGAS") && v.content.length < 10) {
      ctx.addIssue({ code: "custom", path: ["content"], message: v.type === "TUGAS" ? "Tulis instruksi tugas" : "Tulis isi bacaan" });
    }
  });
export type LessonInput = z.input<typeof lessonSchema>;

export const materialSchema = z.object({
  lessonId: z.string().min(1),
  mediaId: z.string().min(1, "Unggah PDF lebih dulu"),
  title: z.string().trim().min(3, "Judul lampiran minimal 3 karakter").max(120, "Judul terlalu panjang"),
});

export const quizSettingsSchema = z.object({
  quizId: z.string().min(1),
  title: z.string().trim().min(3, "Judul kuis minimal 3 karakter").max(150),
  passingScore: intField("Nilai lulus", 0, 100),
});
export type QuizSettingsInput = z.input<typeof quizSettingsSchema>;

export const idSchema = z.object({ id: z.string().min(1) });
