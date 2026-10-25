"use server";

import { revalidatePath } from "next/cache";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { formatRetry, rateLimit } from "@/lib/rate-limit";
import { AuthorizationError, requireRole } from "@/lib/rbac";

import { submitPracticalSchema, type SubmitPracticalInput } from "./schemas";
import { syncCertificateTrack } from "./service";

/**
 * Kirim link Google Drive tugas praktik (revisi RMED). Hanya peserta batch yang berjalan,
 * setelah semua materi selesai dan rata-rata kuis memenuhi nilai minimal; kiriman ulang
 * hanya saat admin meminta revisi.
 */
export async function kirimTugasPraktik(input: SubmitPracticalInput): Promise<ActionResult<null>> {
  let user;
  try {
    user = await requireRole("USER");
  } catch (e) {
    if (e instanceof AuthorizationError) return fail(e.message);
    throw e;
  }
  const parsed = submitPracticalSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const limit = await rateLimit(`tugas-praktik:${user.id}`, 10, 60 * 60);
  if (!limit.allowed) return fail(`Terlalu banyak percobaan. Coba lagi dalam ${formatRetry(limit.retryAfterSec)}.`);

  const track = await syncCertificateTrack(user.id, parsed.data.courseId);
  if (!track?.participant) return fail("Kelas ini tidak membuka tugas praktik untuk akunmu.");
  if (!track.canSubmit) {
    if (track.participant.status === "MENUNGGU_PENILAIAN") return fail("Tugasmu sedang dinilai admin.");
    if (track.requirement && track.requirement.completed < track.requirement.total) return fail("Selesaikan semua materi kelas lebih dulu.");
    if (track.requirement?.average !== null && track.requirement && track.requirement.average < track.minScore) {
      return fail(`Rata-rata nilai kuis belum mencapai ${track.minScore}. Ulangi kuis untuk menaikkan nilai.`);
    }
    return fail("Tugas praktik tidak bisa dikirim saat ini.");
  }

  const participantId = track.participant.id;
  await prisma.$transaction(async (tx) => {
    // Cek ulang status di dalam transaksi agar dua kiriman bersamaan tidak sama-sama lolos.
    const p = await tx.batchParticipant.findUniqueOrThrow({ where: { id: participantId }, select: { status: true } });
    if (p.status !== "BERJALAN" && p.status !== "REVISI") throw new Error("SUDAH_DIKIRIM");
    await tx.practicalSubmission.create({ data: { participantId, driveUrl: parsed.data.driveUrl, note: parsed.data.note || null } });
    await tx.batchParticipant.update({
      where: { id: participantId },
      data: { status: "MENUNGGU_PENILAIAN", finalScore: track.requirement?.average ?? null },
    });
  }).catch((e) => {
    if (e instanceof Error && e.message === "SUDAH_DIKIRIM") return null;
    throw e;
  });

  revalidatePath("/dashboard/sertifikat");
  revalidatePath("/kelas", "layout");
  return ok(null);
}
