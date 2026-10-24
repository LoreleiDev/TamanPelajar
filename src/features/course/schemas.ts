import { z } from "zod";

const id = z.string().min(1).max(40);

export const progressSchema = z.object({
  lessonId: id,
  positionSec: z.number().int().min(0).max(24 * 3600),
  /** Detik tontonan sejak simpan terakhir; dibatasi agar tidak bisa dipalsukan besar. */
  watchedDeltaSec: z.number().int().min(0).max(120),
});

export const lessonIdSchema = z.object({ lessonId: id });

export const markCompleteSchema = z.object({ lessonId: id, completed: z.boolean() });

export const noteSchema = z.object({
  lessonId: id,
  content: z.string().max(5000, "Catatan maksimal 5.000 karakter"),
});

export const discussionSchema = z.object({
  lessonId: id,
  body: z.string().trim().min(5, "Tulis pertanyaan minimal 5 karakter").max(2000, "Maksimal 2.000 karakter"),
});

export const quizSubmitSchema = z.object({
  lessonId: id,
  answers: z.record(
    id,
    z.object({
      optionIds: z.array(id).max(10).optional(),
      textAnswer: z.string().max(500).optional(),
      numberAnswer: z.number().finite().optional(),
    }),
  ),
});

export type QuizSubmitInput = z.input<typeof quizSubmitSchema>;
