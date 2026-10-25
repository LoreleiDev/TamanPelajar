import { prisma } from "@/lib/prisma";

import {
  averageBestQuizScore,
  canSubmitPractical,
  expiresWithBatch,
  pickCurrentBatch,
  pickNextBatch,
  type ParticipantStatus,
  type Requirement,
} from "./rules";

// Sertifikat berbasis batch (revisi RMED): siswa berlangganan masuk batch yang sedang berjalan;
// sertifikat butuh semua materi selesai, rata-rata kuis ≥ nilai minimal, dan tugas praktik yang
// disetujui admin. Yang gagal ikut batch berikutnya gratis. Status kedaluwarsa dihitung saat
// diakses (lazy), seperti attempt tryout.

const FAIL_EXPIRED = "Batch berakhir sebelum tugas praktik disetujui.";

/** Tutup partisipasi di batch yang sudah berakhir: BERJALAN/REVISI menjadi GAGAL. */
async function closeEndedBatches(userId: string, courseId: string, now: Date) {
  const open = await prisma.batchParticipant.findMany({
    where: { userId, batch: { courseId, endsAt: { lt: now } }, status: { in: ["BERJALAN", "REVISI"] } },
    select: { id: true, status: true },
  });
  const ids = open.filter((p) => expiresWithBatch(p.status)).map((p) => p.id);
  if (ids.length) await prisma.batchParticipant.updateMany({ where: { id: { in: ids } }, data: { status: "GAGAL", failReason: FAIL_EXPIRED } });
}

async function hasPaidEnrollment(userId: string, courseId: string, now: Date) {
  const row = await prisma.enrollment.findFirst({
    where: { userId, status: "AKTIF", expiresAt: { gt: now }, product: { courses: { some: { courseId } } } },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Akses ulang gratis: siswa yang gagal di batch sebelumnya boleh membuka kelas itu selama
 * batch berikutnya berjalan, walau masa aktif paketnya sudah habis.
 */
export async function getRetakeAccess(userId: string, courseId: string, now = new Date()) {
  const batches = await prisma.courseBatch.findMany({ where: { courseId }, select: { id: true, name: true, startsAt: true, endsAt: true } });
  const current = pickCurrentBatch(batches, now);
  if (!current) return null;
  const history = await prisma.batchParticipant.findMany({
    where: { userId, batch: { courseId } },
    select: { status: true, isRetake: true, batchId: true, batch: { select: { startsAt: true, endsAt: true } } },
  });
  if (history.some((p) => p.status === "LULUS")) return null;
  const inCurrent = history.find((p) => p.batchId === current.id);
  const failedBefore = history.some(
    (p) => p.batchId !== current.id && p.batch.startsAt < current.startsAt && (p.status === "GAGAL" || (p.batch.endsAt < now && expiresWithBatch(p.status))),
  );
  if ((inCurrent && inCurrent.isRetake) || (!inCurrent && failedBefore)) return { batchName: current.name, endsAt: current.endsAt };
  return null;
}

/** Hapus progres dan nilai kuis kelas saat siswa memulai ulang di batch baru. */
async function resetCourseProgress(userId: string, courseId: string) {
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({ where: { userId, lesson: { section: { courseId } } } }),
    prisma.quizAttempt.deleteMany({ where: { userId, quiz: { lesson: { section: { courseId } } } } }),
  ]);
}

/** Progres syarat sertifikat: materi selesai dan rata-rata nilai terbaik kuis. */
export async function getRequirement(userId: string, courseId: string, minScore: number): Promise<Requirement> {
  const [total, completed, quizzes] = await Promise.all([
    prisma.lesson.count({ where: { section: { courseId } } }),
    prisma.lessonProgress.count({ where: { userId, completedAt: { not: null }, lesson: { section: { courseId } } } }),
    prisma.quiz.findMany({
      where: { lesson: { section: { courseId } } },
      select: { attempts: { where: { userId }, orderBy: { score: "desc" }, take: 1, select: { score: true } } },
    }),
  ]);
  return { completed, total, average: averageBestQuizScore(quizzes.map((q) => ({ best: q.attempts[0]?.score ?? null }))), minScore };
}

export interface CertificateTrack {
  courseId: string;
  certificateTitle: string;
  minScore: number;
  instructions: string | null;
  hasTemplate: boolean;
  batch: { id: string; name: string; startsAt: Date; endsAt: Date } | null;
  nextBatch: { name: string; startsAt: Date } | null;
  participant: {
    id: string;
    status: ParticipantStatus;
    isRetake: boolean;
    failReason: string | null;
    batchName: string;
  } | null;
  requirement: Requirement | null;
  canSubmit: boolean;
  submissions: { id: string; driveUrl: string; note: string | null; status: "MENUNGGU" | "DISETUJUI" | "REVISI" | "DITOLAK"; reviewNote: string | null; createdAt: Date; reviewedAt: Date | null }[];
  certificateNumber: string | null;
}

/**
 * Keadaan sertifikat satu kelas untuk satu siswa, sekaligus mendaftarkannya ke batch yang
 * berjalan bila berhak (berlangganan atau ulang gratis). Mengembalikan null bila kelas tidak
 * punya sertifikat atau belum punya batch: bagian sertifikat tidak ditampilkan sama sekali.
 */
export async function syncCertificateTrack(userId: string, courseId: string, now = new Date()): Promise<CertificateTrack | null> {
  const certificate = await prisma.certificate.findUnique({
    where: { courseId },
    select: { id: true, title: true, minScore: true, practicalInstructions: true, practicalTemplateId: true },
  });
  if (!certificate) return null;
  const batches = await prisma.courseBatch.findMany({ where: { courseId }, select: { id: true, name: true, startsAt: true, endsAt: true } });
  if (batches.length === 0) return null;

  await closeEndedBatches(userId, courseId, now);
  const current = pickCurrentBatch(batches, now);
  const issued = await prisma.userCertificate.findUnique({
    where: { certificateId_userId: { certificateId: certificate.id, userId } },
    select: { number: true },
  });

  let participant = current
    ? await prisma.batchParticipant.findUnique({ where: { batchId_userId: { batchId: current.id, userId } } })
    : null;

  if (current && !participant && !issued) {
    const [paid, retake, failedBefore] = await Promise.all([
      hasPaidEnrollment(userId, courseId, now),
      getRetakeAccess(userId, courseId, now),
      prisma.batchParticipant.count({ where: { userId, batch: { courseId }, status: "GAGAL" } }),
    ]);
    if (paid || retake) {
      try {
        participant = await prisma.batchParticipant.create({
          data: { batchId: current.id, userId, isRetake: failedBefore > 0 },
        });
        // Mulai ulang dari nol agar nilai dan progres batch sebelumnya tidak terbawa.
        if (failedBefore > 0) await resetCourseProgress(userId, courseId);
      } catch {
        // Dua request bersamaan: baris sudah dibuat request lain.
        participant = await prisma.batchParticipant.findUnique({ where: { batchId_userId: { batchId: current.id, userId } } });
      }
    }
  }

  // Bila tidak ada batch berjalan, tampilkan partisipasi terakhir (mis. menunggu penilaian).
  const shown =
    participant ??
    (await prisma.batchParticipant.findFirst({ where: { userId, batch: { courseId } }, orderBy: { batch: { startsAt: "desc" } } }));
  const shownBatch = shown ? batches.find((b) => b.id === shown.batchId)! : null;

  const [requirement, submissions] = await Promise.all([
    shown && shown.status !== "LULUS" ? getRequirement(userId, courseId, certificate.minScore) : Promise.resolve(null),
    shown
      ? prisma.practicalSubmission.findMany({
          where: { participantId: shown.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, driveUrl: true, note: true, status: true, reviewNote: true, createdAt: true, reviewedAt: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    courseId,
    certificateTitle: certificate.title,
    minScore: certificate.minScore,
    instructions: certificate.practicalInstructions,
    hasTemplate: Boolean(certificate.practicalTemplateId),
    batch: current,
    nextBatch: (() => {
      const n = pickNextBatch(batches, now);
      return n ? { name: n.name, startsAt: n.startsAt } : null;
    })(),
    participant: shown
      ? { id: shown.id, status: shown.status, isRetake: shown.isRetake, failReason: shown.failReason, batchName: shownBatch!.name }
      : null,
    requirement,
    canSubmit:
      Boolean(shown && requirement && shownBatch && shown.batchId === current?.id) &&
      canSubmitPractical({ status: shown!.status, requirement: requirement!, now, endsAt: shownBatch!.endsAt }),
    submissions,
    certificateNumber: issued?.number ?? null,
  };
}
