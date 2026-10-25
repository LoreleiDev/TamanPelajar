"use server";

import type { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { formatRetry, rateLimit } from "@/lib/rate-limit";
import { AuthorizationError, requireRole } from "@/lib/rbac";

import { finalizeAttempt, loadAttempt, saveTimeline, timelineOf, type AttemptCore } from "./attempt";
import { finishActiveSection, initialTimeline, startBlock, startBlockMessage } from "./engine";
import { activitySchema, attemptIdSchema, saveAnswerSchema, startExamSchema, submitSchema, visitSchema } from "./schemas";

// Server action tryout CBT (I.2–I.4). Setiap action: validasi Zod, cek sesi, cek kepemilikan
// percobaan, lalu cek waktu di server. Jam client tidak pernah dipercaya.

const TIME_UP = "Waktu ujian sudah habis. Jawabanmu sudah dikumpulkan.";
/** Toleransi latensi jaringan untuk simpanan yang dikirim tepat sebelum batas waktu. */
const GRACE_MS = 2000;

async function session() {
  try {
    return { user: await requireRole() } as const;
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) } as const;
    throw e;
  }
}

/** Sesi + validasi + percobaan milik pengguna yang masih berlangsung. */
async function guardAttempt<S extends z.ZodType<{ attemptId: string }>>(schema: S, input: unknown) {
  const s = await session();
  if (s.error) return { error: s.error } as const;
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: invalidInput(parsed.error) } as const;
  const data = parsed.data as z.infer<S>;
  const attempt = await loadAttempt(data.attemptId);
  if (!attempt || attempt.userId !== s.user.id) return { error: fail("Percobaan tryout tidak ditemukan.") } as const;
  return { user: s.user, data, attempt } as const;
}

const timeUp = (): ActionResult<never> => ({ ok: false, error: TIME_UP, code: "WAKTU_HABIS" });

export interface SectionState {
  activeSectionId: string | null;
  deadlineAt: string | null;
  sections: { id: string; startedAt: string | null; deadlineAt: string | null; submittedAt: string | null }[];
}

function sectionState(attempt: AttemptCore, timeline: ReturnType<typeof timelineOf>): SectionState {
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  return {
    activeSectionId: timeline.activeIndex >= 0 ? attempt.exam.sections[timeline.activeIndex].id : null,
    deadlineAt: iso(timeline.deadlineAt),
    sections: timeline.sections.map((s) => ({ id: s.sectionId, startedAt: iso(s.startedAt), deadlineAt: iso(s.deadlineAt), submittedAt: iso(s.submittedAt) })),
  };
}

/**
 * Periksa waktu percobaan. Bila seluruh waktu habis, percobaan dikumpulkan otomatis dan
 * action mengembalikan WAKTU_HABIS; bila hanya subtes yang habis, jadwal dimajukan.
 */
async function liveTimeline(attempt: AttemptCore, now: Date) {
  if (attempt.status !== "BERLANGSUNG") return null;
  const graceNow = new Date(now.getTime() - GRACE_MS);
  const timeline = timelineOf(attempt, graceNow);
  if (timeline.activeIndex < 0 || graceNow >= attempt.deadlineAt) {
    await finalizeAttempt(attempt.id, { auto: true, now });
    return null;
  }
  await saveTimeline(attempt.id, timeline);
  return timeline;
}

/** Mulai percobaan baru dari halaman petunjuk (I.2). Percobaan yang masih berjalan dilanjutkan. */
export async function mulaiTryout(input: unknown): Promise<ActionResult<{ attemptId: string }>> {
  const s = await session();
  if (s.error) return s.error;
  const parsed = startExamSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const limit = await rateLimit(`mulai-tryout:${s.user.id}`, 10, 60);
  if (!limit.allowed) return fail(`Terlalu banyak percobaan. Coba lagi dalam ${formatRetry(limit.retryAfterSec)}.`);

  const exam = await prisma.exam.findFirst({
    where: { slug: parsed.data.slug, status: "TERBIT", deletedAt: null },
    select: {
      id: true,
      durationMin: true,
      opensAt: true,
      closesAt: true,
      maxAttempts: true,
      sections: { orderBy: { order: "asc" }, select: { id: true, durationMin: true } },
      _count: { select: { questions: true } },
    },
  });
  if (!exam || exam._count.questions === 0) return fail("Tryout tidak ditemukan atau belum berisi soal.");

  const now = new Date();
  const attempts = await prisma.examAttempt.findMany({
    where: { examId: exam.id, userId: s.user.id },
    select: { id: true, status: true, deadlineAt: true, attemptNo: true },
    orderBy: { attemptNo: "desc" },
  });
  const ongoing = attempts.find((a) => a.status === "BERLANGSUNG");
  if (ongoing) {
    if (ongoing.deadlineAt > now) return ok({ attemptId: ongoing.id });
    await finalizeAttempt(ongoing.id, { auto: true, now });
  }

  const enrolled = await prisma.enrollment.count({
    where: { userId: s.user.id, status: "AKTIF", expiresAt: { gt: now }, product: { exams: { some: { examId: exam.id } } } },
  });
  const block = startBlock({
    now,
    loggedIn: true,
    isAdmin: s.user.role === "ADMIN",
    enrolled: enrolled > 0,
    opensAt: exam.opensAt,
    closesAt: exam.closesAt,
    attemptsUsed: attempts.length,
    maxAttempts: exam.maxAttempts,
  });
  if (block) return fail(startBlockMessage[block]);

  const plan = initialTimeline(
    exam.sections.map((x) => ({ sectionId: x.id, durationMin: x.durationMin })),
    now,
    exam.durationMin,
  );
  try {
    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        userId: s.user.id,
        attemptNo: (attempts[0]?.attemptNo ?? 0) + 1,
        seed: Math.floor(Math.random() * 2 ** 31),
        startedAt: now,
        deadlineAt: plan.deadlineAt,
        sections: { create: plan.sections.map((x) => ({ sectionId: x.sectionId, startedAt: x.startedAt, deadlineAt: x.deadlineAt })) },
        activity: { create: { type: "MULAI", at: now } },
      },
      select: { id: true },
    });
    return ok({ attemptId: attempt.id });
  } catch (e) {
    // Dua klik bersamaan: unique (examId, userId, attemptNo) menolak yang kedua.
    const existing = await prisma.examAttempt.findFirst({
      where: { examId: exam.id, userId: s.user.id, status: "BERLANGSUNG" },
      select: { id: true },
    });
    if (existing) return ok({ attemptId: existing.id });
    throw e;
  }
}

/** Autosave satu jawaban beserta status ragu-ragu (I.4.2, I.4.4). */
export async function simpanJawaban(input: unknown): Promise<ActionResult<{ savedAt: string; state: SectionState }>> {
  const g = await guardAttempt(saveAnswerSchema, input);
  if (g.error) return g.error;
  const limit = await rateLimit(`jawaban:${g.data.attemptId}`, 240, 60);
  if (!limit.allowed) return fail("Terlalu banyak simpanan dalam satu menit. Tunggu sebentar.");

  const now = new Date();
  const timeline = await liveTimeline(g.attempt, now);
  if (!timeline) return timeUp();

  const eq = await prisma.examQuestion.findFirst({
    where: { examId: g.attempt.examId, questionId: g.data.questionId },
    select: { sectionId: true, question: { select: { type: true, options: { select: { id: true } } } } },
  });
  if (!eq) return fail("Soal tidak ditemukan di tryout ini.");
  const active = g.attempt.exam.sections[timeline.activeIndex];
  if (timeline.mode === "berurutan" && eq.sectionId !== active.id) {
    return { ok: false, error: "Subtes soal ini sudah ditutup.", code: "SUBTES_DITUTUP" };
  }

  const { answer } = g.data;
  const valid = new Set(eq.question.options.map((o) => o.id));
  const type = eq.question.type;
  const optionIds = answer.optionIds?.filter((x) => valid.has(x)) ?? null;
  const single = type === "PG_TUNGGAL" || type === "BENAR_SALAH";
  const data = {
    optionIds: ["PG_TUNGGAL", "PG_JAMAK", "BENAR_SALAH"].includes(type) && optionIds?.length ? (single ? optionIds.slice(0, 1) : optionIds) : undefined,
    textAnswer: type === "ISIAN_SINGKAT" || type === "ESSAY" ? (answer.textAnswer?.trim() ? answer.textAnswer : null) : null,
    numberAnswer: type === "NUMERIK" ? answer.numberAnswer : null,
    isDoubtful: g.data.isDoubtful,
  };
  // optionIds kosong disimpan sebagai JSON null; Prisma memakai DbNull untuk kolom Json.
  const row = { ...data, optionIds: data.optionIds ?? Prisma.DbNull };

  await prisma.$transaction([
    prisma.examAnswer.upsert({
      where: { attemptId_questionId: { attemptId: g.attempt.id, questionId: g.data.questionId } },
      create: { attemptId: g.attempt.id, questionId: g.data.questionId, ...row, timeSpentSec: g.data.timeSpentDeltaSec },
      update: { ...row, timeSpentSec: { increment: g.data.timeSpentDeltaSec } },
    }),
    prisma.examAttempt.update({ where: { id: g.attempt.id }, data: { currentQuestionId: g.data.questionId } }),
  ]);
  return ok({ savedAt: now.toISOString(), state: sectionState(g.attempt, timeline) });
}

/** Simpan soal aktif dan waktu di soal sebelumnya saat berpindah (I.4.4, J.2.3). */
export async function pindahSoal(input: unknown): Promise<ActionResult<null>> {
  const g = await guardAttempt(visitSchema, input);
  if (g.error) return g.error;
  if (g.attempt.status !== "BERLANGSUNG" || new Date() >= g.attempt.deadlineAt) return timeUp();
  const ids = [g.data.questionId, g.data.fromQuestionId].filter((x): x is string => Boolean(x));
  const count = await prisma.examQuestion.count({ where: { examId: g.attempt.examId, questionId: { in: ids } } });
  if (count !== new Set(ids).size) return fail("Soal tidak ditemukan di tryout ini.");

  await prisma.$transaction([
    prisma.examAttempt.update({ where: { id: g.attempt.id }, data: { currentQuestionId: g.data.questionId } }),
    ...(g.data.fromQuestionId && g.data.timeSpentDeltaSec > 0
      ? [
          prisma.examAnswer.upsert({
            where: { attemptId_questionId: { attemptId: g.attempt.id, questionId: g.data.fromQuestionId } },
            create: { attemptId: g.attempt.id, questionId: g.data.fromQuestionId, timeSpentSec: g.data.timeSpentDeltaSec },
            update: { timeSpentSec: { increment: g.data.timeSpentDeltaSec } },
          }),
        ]
      : []),
  ]);
  return ok(null);
}

/**
 * Tutup subtes aktif dan buka subtes berikutnya (I.4.14), juga dipanggil client saat waktu
 * subtes habis. Bila subtes terakhir, percobaan dikumpulkan.
 */
export async function lanjutSubtes(input: unknown): Promise<ActionResult<{ finished: boolean; state: SectionState | null }>> {
  const g = await guardAttempt(attemptIdSchema, input);
  if (g.error) return g.error;
  const now = new Date();
  const timeline = await liveTimeline(g.attempt, now);
  if (!timeline) return ok({ finished: true, state: null });
  const next = finishActiveSection(timeline, g.attempt.startedAt, g.attempt.deadlineAt, now);
  if (next.activeIndex < 0) {
    await finalizeAttempt(g.attempt.id, { auto: false, now });
    return ok({ finished: true, state: null });
  }
  await saveTimeline(g.attempt.id, next);
  return ok({ finished: false, state: sectionState(g.attempt, next) });
}

/** Kumpulkan tryout (I.4.6–I.4.9). Idempoten: memanggil dua kali tetap satu hasil. */
export async function kumpulkanTryout(input: unknown): Promise<ActionResult<{ attemptId: string }>> {
  const g = await guardAttempt(submitSchema, input);
  if (g.error) return g.error;
  const limit = await rateLimit(`kumpulkan:${g.data.attemptId}`, 10, 60);
  if (!limit.allowed) return fail("Terlalu banyak permintaan. Tunggu sebentar.");
  await finalizeAttempt(g.attempt.id, { auto: g.data.auto });
  return ok({ attemptId: g.attempt.id });
}

/** Catat pindah tab dan fullscreen (I.4.10–I.4.12). */
export async function catatAktivitas(input: unknown): Promise<ActionResult<null>> {
  const g = await guardAttempt(activitySchema, input);
  if (g.error) return g.error;
  if (g.attempt.status !== "BERLANGSUNG") return ok(null);
  const limit = await rateLimit(`aktivitas:${g.data.attemptId}`, 60, 60);
  if (!limit.allowed) return ok(null);
  await prisma.examActivityLog.create({ data: { attemptId: g.attempt.id, type: g.data.type } });
  return ok(null);
}
