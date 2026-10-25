"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canRequestRevision, certificateNumber, pickNextBatch } from "@/features/certificate/rules";
import { batchSchema, certificateSettingsSchema, reviewPracticalSchema } from "@/features/certificate/schemas";
import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { fromJakartaInput } from "@/lib/datetime";
import { practicalResultMail, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "./guard";

// Sertifikat berbasis batch dan tugas praktik (revisi RMED, C.2.5, P.1.10).

const decisionText = { SETUJUI: "disetujui", REVISI: "diminta revisi", TOLAK: "ditolak" } as const;

/** Setujui, minta revisi (sekali), atau tolak tugas praktik; kabari siswa lewat notifikasi dan email. */
export async function nilaiTugasPraktik(input: unknown): Promise<ActionResult<{ certificate: string | null }>> {
  return adminAction(async (admin) => {
    const parsed = reviewPracticalSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { submissionId, decision } = parsed.data;
    const note = parsed.data.note || null;

    const sub = await prisma.practicalSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        participant: {
          select: {
            id: true,
            userId: true,
            user: { select: { name: true, email: true } },
            batch: {
              select: {
                id: true,
                name: true,
                endsAt: true,
                course: { select: { id: true, slug: true, title: true, certificate: { select: { id: true } }, batches: { select: { id: true, name: true, startsAt: true, endsAt: true } } } },
              },
            },
            _count: { select: { submissions: { where: { status: "REVISI" } } } },
          },
        },
      },
    });
    if (!sub) return fail("Kiriman tugas tidak ditemukan.");
    if (sub.status !== "MENUNGGU") return fail("Kiriman ini sudah dinilai.");
    const { participant } = sub;
    const { batch } = participant;
    const course = batch.course;
    if (!course.certificate) return fail("Sertifikat kelas ini sudah dinonaktifkan.");
    const now = new Date();
    if (decision === "REVISI" && !canRequestRevision({ revisionsGiven: participant._count.submissions, now, endsAt: batch.endsAt })) {
      return fail(participant._count.submissions > 0 ? "Revisi hanya bisa diminta sekali per batch. Pilih setujui atau tolak." : "Batch sudah berakhir; revisi tidak bisa diminta lagi.");
    }

    let number: string | null = null;
    await prisma.$transaction(async (tx) => {
      // Cek ulang di dalam transaksi agar dua admin tidak menilai kiriman yang sama.
      const fresh = await tx.practicalSubmission.updateMany({
        where: { id: sub.id, status: "MENUNGGU" },
        data: { status: decision === "SETUJUI" ? "DISETUJUI" : decision === "REVISI" ? "REVISI" : "DITOLAK", reviewNote: note, reviewedById: admin.id, reviewedAt: now },
      });
      if (fresh.count === 0) throw new Error("SUDAH_DINILAI");
      if (decision === "SETUJUI") {
        const count = await tx.userCertificate.count({ where: { certificateId: course.certificate!.id } });
        number = certificateNumber({ year: now.getUTCFullYear(), courseSlug: course.slug, sequence: count + 1, userId: participant.userId });
        await tx.userCertificate.create({
          data: { certificateId: course.certificate!.id, userId: participant.userId, participantId: participant.id, number, issuedAt: now },
        });
      }
      await tx.batchParticipant.update({
        where: { id: participant.id },
        data:
          decision === "SETUJUI"
            ? { status: "LULUS", failReason: null }
            : decision === "REVISI"
              ? { status: "REVISI" }
              : { status: "GAGAL", failReason: note },
      });
      await tx.notification.create({
        data: {
          userId: participant.userId,
          type: "KELAS",
          title: decision === "SETUJUI" ? "Sertifikat terbit" : decision === "REVISI" ? "Tugas praktik perlu revisi" : "Tugas praktik belum disetujui",
          body:
            decision === "SETUJUI"
              ? `Selamat, tugas praktik ${course.title} disetujui. Sertifikatmu sudah bisa diunduh.`
              : decision === "REVISI"
                ? `Perbaiki tugas praktik ${course.title} lalu kirim ulang sebelum ${batch.name} berakhir.`
                : `Kamu bisa mengulang ${course.title} gratis di batch berikutnya.`,
          href: number ? `/sertifikat/${number}` : "/dashboard/sertifikat",
        },
      });
      await audit(tx, admin, `tugas-praktik.${decision.toLowerCase()}`, "PracticalSubmission", sub.id, {
        after: { status: decisionText[decision], catatan: note, sertifikat: number },
      });
    });

    const next = pickNextBatch(course.batches, now);
    await sendMail(
      practicalResultMail(participant.user.email, participant.user.name, {
        courseTitle: course.title,
        decision,
        note: note ?? undefined,
        href: number ? `/sertifikat/${number}` : "/dashboard/sertifikat",
        nextBatch: next?.name ?? null,
      }),
    );
    revalidatePath("/admin/tugas-praktik");
    revalidatePath("/admin/sertifikat");
    return ok({ certificate: number });
  }).catch((e) => {
    if (e instanceof Error && e.message === "SUDAH_DINILAI") return fail("Kiriman ini baru saja dinilai admin lain.");
    throw e;
  });
}

const refreshCourse = (courseId: string) => revalidatePath(`/admin/kelas/${courseId}`);

/** Buat atau ubah batch kelas. Batch dalam satu kelas tidak boleh tumpang tindih. */
export async function simpanBatch(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = batchSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, courseId, name, startsOn, endsOn } = parsed.data;
    const startsAt = fromJakartaInput(`${startsOn}T00:00`);
    const endsAt = fromJakartaInput(`${endsOn}T23:59`);
    if (!startsAt) return fail("Tanggal mulai tidak valid.", { startsOn: "Tanggal tidak valid" });
    if (!endsAt) return fail("Tanggal selesai tidak valid.", { endsOn: "Tanggal tidak valid" });

    const overlap = await prisma.courseBatch.findFirst({
      where: { courseId, id: id ? { not: id } : undefined, startsAt: { lte: endsAt }, endsAt: { gte: startsAt } },
      select: { name: true },
    });
    if (overlap) return fail(`Tanggalnya bertabrakan dengan ${overlap.name}.`, { startsOn: "Bertabrakan dengan batch lain" });

    if (id) {
      const before = await prisma.courseBatch.update({ where: { id }, data: { name, startsAt, endsAt }, select: { id: true } });
      await audit(prisma, admin, "batch.ubah", "CourseBatch", id, { after: { name, startsOn, endsOn } });
      refreshCourse(courseId);
      return ok(before);
    }
    const created = await prisma.courseBatch.create({ data: { courseId, name, startsAt, endsAt }, select: { id: true } });
    await audit(prisma, admin, "batch.buat", "CourseBatch", created.id, { after: { name, startsOn, endsOn } });
    refreshCourse(courseId);
    return ok(created);
  });
}

/** Hapus batch yang belum punya peserta. */
export async function hapusBatch(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const batch = await prisma.courseBatch.findUnique({
      where: { id: parsed.data.id },
      select: { name: true, courseId: true, _count: { select: { participants: true } } },
    });
    if (!batch) return fail("Batch tidak ditemukan.");
    if (batch._count.participants > 0) return fail("Batch yang sudah punya peserta tidak bisa dihapus. Ubah tanggalnya bila perlu.");
    await prisma.courseBatch.delete({ where: { id: parsed.data.id } });
    await audit(prisma, admin, "batch.hapus", "CourseBatch", parsed.data.id, { before: { name: batch.name } });
    refreshCourse(batch.courseId);
    return ok(null);
  });
}

/** Judul, nilai minimal, instruksi, dan template tugas praktik sertifikat kelas. */
export async function simpanPengaturanSertifikat(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = certificateSettingsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, ...data } = parsed.data;
    if (data.practicalTemplateId) {
      const media = await prisma.media.findUnique({ where: { id: data.practicalTemplateId }, select: { folder: true, deliveryType: true } });
      if (!media || media.deliveryType !== "AUTHENTICATED") return fail("Template tugas tidak dikenali. Unggah ulang filenya.");
    }
    const before = await prisma.certificate.findUnique({ where: { id }, select: { title: true, minScore: true, practicalTemplateId: true } });
    if (!before) return fail("Sertifikat tidak ditemukan.");
    await prisma.certificate.update({ where: { id }, data: { ...data, practicalInstructions: data.practicalInstructions || null } });
    await audit(prisma, admin, "sertifikat.ubah", "Certificate", id, { before, after: { title: data.title, minScore: data.minScore, practicalTemplateId: data.practicalTemplateId } });
    revalidatePath("/admin/sertifikat");
    return ok(null);
  });
}
