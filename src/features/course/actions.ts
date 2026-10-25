"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { scoreExam, type ScoringQuestion } from "@/features/scoring/score";
import { canAccessLesson } from "@/lib/access";
import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { formatRetry, rateLimit } from "@/lib/rate-limit";
import { AuthorizationError, requireRole } from "@/lib/rbac";

import {
  discussionSchema,
  lessonIdSchema,
  markCompleteSchema,
  noteSchema,
  progressSchema,
  quizSubmitSchema,
  type QuizSubmitInput,
} from "./schemas";

const LOCKED = "Materi ini belum terbuka untuk akunmu.";

/** Sesi + validasi + akses materi dalam satu langkah, dipakai semua action kelas. */
async function guard<S extends z.ZodType<{ lessonId: string }>>(schema: S, input: unknown) {
  let user;
  try {
    user = await requireRole();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) } as const;
    throw e;
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: invalidInput(parsed.error) } as const;
  const data = parsed.data as z.infer<S>;
  const { access, lesson } = await canAccessLesson(user, data.lessonId);
  if (access !== "terbuka" || !lesson) return { error: fail(LOCKED) } as const;
  return { user, data, courseId: lesson.courseId } as const;
}

const today = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

async function addStudyTime(userId: string, courseId: string, seconds: number) {
  if (seconds <= 0) return;
  const date = today();
  const row = await prisma.learningSession.findFirst({ where: { userId, courseId, date }, select: { id: true } });
  if (row) await prisma.learningSession.update({ where: { id: row.id }, data: { seconds: { increment: seconds } } });
  else await prisma.learningSession.create({ data: { userId, courseId, date, seconds } });
}

/** Semua materi kelas selesai? Dipakai untuk mengarahkan siswa ke syarat sertifikat. */
async function isCourseDone(userId: string, courseId: string) {
  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: { section: { courseId } } }),
    prisma.lessonProgress.count({ where: { userId, completedAt: { not: null }, lesson: { section: { courseId } } } }),
  ]);
  return total > 0 && done >= total;
}

async function setCompleted(userId: string, lessonId: string, courseId: string, completed: boolean) {
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, completedAt: completed ? new Date() : null },
    update: { completedAt: completed ? new Date() : null },
  });
  // Sertifikat tidak terbit di sini: butuh nilai minimal dan tugas praktik yang disetujui admin.
  return completed ? isCourseDone(userId, courseId) : false;
}

/**
 * Simpan posisi video dan waktu tonton (G.4.1, G.4.2, H.2.8). Materi otomatis selesai
 * bila sudah ditonton 90% durasinya.
 */
export async function saveProgress(input: z.input<typeof progressSchema>): Promise<ActionResult<{ completed: boolean; courseDone: boolean }>> {
  const g = await guard(progressSchema, input);
  if ("error" in g) return g.error!;
  const { user, data, courseId } = g;

  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: data.lessonId },
    select: { durationSec: true, video: { select: { durationSec: true } } },
  });
  const duration = lesson.video?.durationSec ?? lesson.durationSec ?? 0;
  const row = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: data.lessonId } },
    create: { userId: user.id, lessonId: data.lessonId, lastPositionSec: data.positionSec, watchedSec: data.watchedDeltaSec },
    update: { lastPositionSec: data.positionSec, watchedSec: { increment: data.watchedDeltaSec } },
  });
  await addStudyTime(user.id, courseId, data.watchedDeltaSec);

  let courseDone = false;
  const reached = duration > 0 && (row.watchedSec >= duration * 0.9 || data.positionSec >= duration * 0.97);
  if (reached && !row.completedAt) courseDone = await setCompleted(user.id, data.lessonId, courseId, true);
  return ok({ completed: Boolean(row.completedAt) || reached, courseDone });
}

/** Tandai selesai atau batalkan (G.2.5). */
export async function markComplete(input: z.input<typeof markCompleteSchema>): Promise<ActionResult<{ courseDone: boolean }>> {
  const g = await guard(markCompleteSchema, input);
  if ("error" in g) return g.error!;
  const courseDone = await setCompleted(g.user.id, g.data.lessonId, g.courseId, g.data.completed);
  revalidatePath("/kelas", "layout");
  return ok({ courseDone });
}

/** Catatan pribadi per materi (G.2.6). Catatan kosong dihapus. */
export async function saveNote(input: z.input<typeof noteSchema>): Promise<ActionResult<null>> {
  const g = await guard(noteSchema, input);
  if ("error" in g) return g.error!;
  const { user, data } = g;
  if (!data.content.trim()) {
    await prisma.lessonNote.deleteMany({ where: { userId: user.id, lessonId: data.lessonId } });
  } else {
    await prisma.lessonNote.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: data.lessonId } },
      create: { userId: user.id, lessonId: data.lessonId, content: data.content },
      update: { content: data.content },
    });
  }
  return ok(null);
}

/** Simpan atau lepas bookmark materi (G.4.8). */
export async function toggleBookmark(input: z.input<typeof lessonIdSchema>): Promise<ActionResult<{ bookmarked: boolean }>> {
  const g = await guard(lessonIdSchema, input);
  if ("error" in g) return g.error!;
  const where = { userId_lessonId: { userId: g.user.id, lessonId: g.data.lessonId } };
  const existing = await prisma.bookmark.findUnique({ where });
  if (existing) await prisma.bookmark.delete({ where });
  else await prisma.bookmark.create({ data: { userId: g.user.id, lessonId: g.data.lessonId } });
  return ok({ bookmarked: !existing });
}

/** Kirim pertanyaan di kolom diskusi (G.2.7). Teks disimpan polos dan dirender sebagai teks. */
export async function postDiscussion(input: z.input<typeof discussionSchema>): Promise<ActionResult<null>> {
  const g = await guard(discussionSchema, input);
  if ("error" in g) return g.error!;
  const limit = await rateLimit(`diskusi:${g.user.id}`, 10, 10 * 60);
  if (!limit.allowed) return fail(`Terlalu banyak pertanyaan. Coba lagi dalam ${formatRetry(limit.retryAfterSec)}.`);
  await prisma.discussion.create({ data: { userId: g.user.id, lessonId: g.data.lessonId, body: g.data.body } });
  revalidatePath("/kelas", "layout");
  return ok(null);
}

export interface QuizResult {
  score: number;
  passed: boolean;
  passingScore: number;
  questions: { id: string; status: "BENAR" | "SALAH" | "KOSONG" | "MENUNGGU_PENILAIAN"; correctOptionIds: string[]; correctText: string | null; explanation: string }[];
  courseDone: boolean;
}

/** Kuis setelah materi (G.4.5). Dinilai di server; kunci dikirim hanya setelah dikumpulkan. */
export async function submitQuiz(input: QuizSubmitInput): Promise<ActionResult<QuizResult>> {
  const g = await guard(quizSubmitSchema, input);
  if ("error" in g) return g.error!;
  const { user, data, courseId } = g;

  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: data.lessonId },
    select: {
      quiz: {
        select: {
          id: true,
          passingScore: true,
          questions: {
            orderBy: { order: "asc" },
            select: { question: { include: { options: { orderBy: { order: "asc" } } } } },
          },
        },
      },
    },
  });
  if (!lesson.quiz) return fail("Materi ini bukan kuis.");
  const qs = lesson.quiz.questions.map((q) => q.question);

  const scoring: ScoringQuestion[] = qs.map((q) => ({
    id: q.id,
    sectionId: "kuis",
    type: q.type,
    topic: q.topic,
    difficulty: q.difficulty,
    weight: 1,
    options: q.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect, score: o.score })),
    correctText: q.correctText,
    correctNumber: q.correctNumber,
    tolerance: q.tolerance,
  }));
  const result = scoreExam(scoring, data.answers, {
    correctScore: 1,
    wrongScore: 0,
    passingGrade: 0,
    sections: [{ id: "kuis", weight: 1, passingGrade: null }],
  });
  const score = result.maxScore ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
  const passed = score >= lesson.quiz.passingScore;

  await prisma.quizAttempt.create({
    data: { quizId: lesson.quiz.id, userId: user.id, score, passed, answers: data.answers, submittedAt: new Date() },
  });
  const courseDone = passed ? await setCompleted(user.id, data.lessonId, courseId, true) : false;
  revalidatePath("/kelas", "layout");

  return ok({
    score,
    passed,
    passingScore: lesson.quiz.passingScore,
    courseDone,
    questions: qs.map((q, i) => ({
      id: q.id,
      status: result.questions[i].status,
      correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
      correctText: q.correctText?.split("|")[0] ?? (q.correctNumber !== null ? String(q.correctNumber).replace(".", ",") : null),
      explanation: q.explanation,
    })),
  });
}
