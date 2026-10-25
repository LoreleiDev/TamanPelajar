import { z } from "zod";

const id = z.string().min(1).max(40);

export const startExamSchema = z.object({
  slug: z.string().min(1).max(191),
  agree: z.literal(true, { error: "Centang persetujuan aturan tryout lebih dulu." }),
});

export const answerSchema = z.object({
  optionIds: z.array(id).max(10).nullable(),
  textAnswer: z.string().max(10_000, "Jawaban maksimal 10.000 karakter").nullable(),
  numberAnswer: z.number().finite().nullable(),
});

export const saveAnswerSchema = z.object({
  attemptId: id,
  questionId: id,
  answer: answerSchema,
  isDoubtful: z.boolean(),
  /** Detik di soal ini sejak simpan terakhir; dibatasi agar tidak bisa dipalsukan besar. */
  timeSpentDeltaSec: z.number().int().min(0).max(900),
});

export const visitSchema = z.object({
  attemptId: id,
  questionId: id,
  timeSpentDeltaSec: z.number().int().min(0).max(900),
  /** Soal yang ditinggalkan, untuk menambah waktu pengerjaannya. */
  fromQuestionId: id.nullable(),
});

export const attemptIdSchema = z.object({ attemptId: id });

export const submitSchema = z.object({ attemptId: id, auto: z.boolean() });

export const activitySchema = z.object({
  attemptId: id,
  type: z.enum(["PINDAH_TAB", "KELUAR_FULLSCREEN", "MASUK_FULLSCREEN"]),
});

export type AnswerInput = z.infer<typeof answerSchema>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
