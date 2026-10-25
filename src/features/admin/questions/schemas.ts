import { z } from "zod";

// Form soal bank soal (M.5.1). Field angka berupa string di form dan diubah oleh Zod;
// aturan kunci jawaban berbeda per jenis soal (I.5).

export const QUESTION_TYPES = ["PG_TUNGGAL", "PG_JAMAK", "BENAR_SALAH", "ISIAN_SINGKAT", "NUMERIK", "ESSAY"] as const;
export type QuestionTypeCode = (typeof QUESTION_TYPES)[number];

export const questionTypeLabel: Record<QuestionTypeCode, string> = {
  PG_TUNGGAL: "Pilihan ganda (satu jawaban)",
  PG_JAMAK: "Pilihan ganda (banyak jawaban)",
  BENAR_SALAH: "Benar atau salah",
  ISIAN_SINGKAT: "Isian singkat",
  NUMERIK: "Angka",
  ESSAY: "Essay",
};

export const difficultyLabel = { MUDAH: "Mudah", SEDANG: "Sedang", SULIT: "Sulit" } as const;

export const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;

const decimalString = (label: string, opts: { min?: number; max?: number; optional?: boolean } = {}) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => (opts.optional && v === "") || /^-?\d+(\.\d+)?$/.test(v), `${label} harus angka`)
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || opts.min === undefined || v >= opts.min, `${label} minimal ${opts.min}`)
    .refine((v) => v === null || opts.max === undefined || v <= opts.max, `${label} maksimal ${opts.max}`);

const optionSchema = z.object({
  body: z.string().trim().max(2000, "Teks opsi terlalu panjang"),
  isCorrect: z.boolean(),
  /** Skor bergradasi (TKP 1–5); kosong = pakai skor benar/salah. */
  score: decimalString("Skor opsi", { min: 0, max: 100, optional: true }),
});

export const questionSchema = z
  .object({
    id: z.string().optional(),
    categoryId: z.string().min(1, "Pilih kategori ujian"),
    subject: z.string().trim().min(2, "Mata pelajaran wajib diisi").max(80, "Mata pelajaran terlalu panjang"),
    topic: z.string().trim().min(2, "Topik wajib diisi").max(80, "Topik terlalu panjang"),
    difficulty: z.enum(["MUDAH", "SEDANG", "SULIT"], { error: "Pilih tingkat kesulitan" }),
    type: z.enum(QUESTION_TYPES, { error: "Pilih jenis soal" }),
    body: z.string().trim().min(5, "Pertanyaan minimal 5 karakter").max(20_000, "Pertanyaan terlalu panjang"),
    explanation: z.string().trim().min(5, "Pembahasan minimal 5 karakter").max(20_000, "Pembahasan terlalu panjang"),
    explanationVideoUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "URL video harus diawali https://"),
    imageId: z.string().nullable(),
    correctText: z.string().trim().max(500, "Kunci jawaban terlalu panjang"),
    correctNumber: decimalString("Kunci jawaban angka", { optional: true }),
    tolerance: decimalString("Toleransi", { min: 0, optional: true }),
    weight: decimalString("Bobot", { min: 0.1, max: 100 }),
    status: z.enum(["DRAF", "TERBIT", "ARSIP"]),
    options: z.array(optionSchema).max(5),
  })
  .superRefine((q, ctx) => {
    const isChoice = q.type === "PG_TUNGGAL" || q.type === "PG_JAMAK" || q.type === "BENAR_SALAH";
    if (isChoice) {
      const filled = q.options.filter((o) => o.body !== "");
      if (q.type === "BENAR_SALAH" && filled.length !== 2) {
        ctx.addIssue({ code: "custom", path: ["options"], message: "Soal benar/salah punya tepat dua opsi" });
      }
      if (filled.length < 2) ctx.addIssue({ code: "custom", path: ["options"], message: "Isi minimal dua opsi jawaban" });
      if (q.options.some((o, i) => o.body === "" && q.options.slice(i + 1).some((n) => n.body !== ""))) {
        ctx.addIssue({ code: "custom", path: ["options"], message: "Isi opsi berurutan dari A tanpa melompati huruf" });
      }
      const graded = filled.some((o) => o.score !== null);
      const correct = filled.filter((o) => o.isCorrect).length;
      if (graded) {
        if (q.type !== "PG_TUNGGAL") ctx.addIssue({ code: "custom", path: ["options"], message: "Skor per opsi hanya untuk pilihan ganda satu jawaban" });
        if (filled.some((o) => o.score === null)) ctx.addIssue({ code: "custom", path: ["options"], message: "Bila memakai skor per opsi, isi skor semua opsi" });
      } else if (q.type === "PG_JAMAK" ? correct < 1 : correct !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: q.type === "PG_JAMAK" ? "Tandai minimal satu jawaban benar" : "Tandai tepat satu jawaban benar",
        });
      }
    }
    if (q.type === "ISIAN_SINGKAT" && q.correctText === "") {
      ctx.addIssue({ code: "custom", path: ["correctText"], message: "Isi kunci jawaban; pisahkan beberapa jawaban benar dengan |" });
    }
    if (q.type === "NUMERIK" && q.correctNumber === null) {
      ctx.addIssue({ code: "custom", path: ["correctNumber"], message: "Isi kunci jawaban angka" });
    }
  });

export type QuestionInput = z.input<typeof questionSchema>;
export type QuestionOutput = z.output<typeof questionSchema>;

export const questionFilterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().trim().max(40).optional().catch(undefined),
  subject: z.string().trim().max(80).optional().catch(undefined),
  type: z.enum(QUESTION_TYPES).optional().catch(undefined),
  difficulty: z.enum(["MUDAH", "SEDANG", "SULIT"]).optional().catch(undefined),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
export type QuestionFilter = z.output<typeof questionFilterSchema>;

export const idsSchema = z.object({ ids: z.array(z.string().min(1)).min(1, "Pilih minimal satu soal").max(200) });
export const bulkStatusSchema = idsSchema.extend({ status: z.enum(["DRAF", "TERBIT", "ARSIP"]) });

/** Opsi tersimpan: hanya yang terisi, berlabel A–E sesuai urutan. */
export function normalizeOptions(q: Pick<QuestionOutput, "type" | "options">) {
  if (q.type !== "PG_TUNGGAL" && q.type !== "PG_JAMAK" && q.type !== "BENAR_SALAH") return [];
  const filled = q.options.filter((o) => o.body !== "");
  // Opsi bergradasi: opsi berskor tertinggi ditandai benar agar pembahasan menyorotnya.
  const graded = filled.some((o) => o.score !== null);
  const top = Math.max(...filled.map((o) => o.score ?? 0));
  return filled.map((o, i) => ({ label: OPTION_LABELS[i], body: o.body, isCorrect: graded ? o.score === top : o.isCorrect, score: graded ? o.score : null, order: i }));
}
