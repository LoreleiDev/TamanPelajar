"use server";

import { revalidatePath, updateTag } from "next/cache";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "../guard";
import { searchQuestionsForExam } from "./queries";
import { addQuestionsSchema, examSchema, idSchema, moveSchema, questionWeightSchema, reorderSchema, sectionSchema } from "./schemas";

// Manajemen tryout (M.6). Pengaturan selalu bisa diubah; struktur (subtes dan soal) terkunci
// begitu ada percobaan, karena urutan, skor maksimum, dan hasil siswa bergantung padanya.

const LOCKED = "Struktur tryout terkunci karena sudah ada percobaan siswa. Duplikat tryout untuk membuat versi baru.";

const revalidate = (examId?: string) => {
  revalidatePath("/admin/tryout");
  if (examId) revalidatePath(`/admin/tryout/${examId}`);
  updateTag("katalog");
};

async function structureLocked(examId: string) {
  return (await prisma.examAttempt.count({ where: { examId } })) > 0;
}

/** Buat atau ubah pengaturan tryout (M.6.1–M.6.6). */
export async function simpanTryout(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = examSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, ...data } = parsed.data;
    const clash = await prisma.exam.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash && clash.id !== id) return fail("Slug sudah dipakai tryout lain.", { slug: "Slug ini sudah dipakai" });
    if (data.status === "TERBIT" && id) {
      const count = await prisma.examQuestion.count({ where: { examId: id } });
      if (count === 0) return fail("Tambahkan subtes dan soal sebelum menerbitkan tryout.", { status: "Tryout tanpa soal tidak bisa diterbitkan" });
    }
    if (data.status === "TERBIT" && !id) return fail("Simpan tryout sebagai draf dulu, lalu tambahkan subtes dan soal.", { status: "Tryout baru dimulai sebagai draf" });

    if (id) {
      const before = await prisma.exam.findFirst({ where: { id, deletedAt: null } });
      if (!before) return fail("Tryout tidak ditemukan.");
      await prisma.exam.update({ where: { id }, data });
      await audit(prisma, admin, "tryout.ubah", "Exam", id, { before, after: data });
      revalidate(id);
      return ok({ id });
    }
    const created = await prisma.exam.create({ data, select: { id: true } });
    await audit(prisma, admin, "tryout.buat", "Exam", created.id, { after: data });
    revalidate();
    return ok(created);
  });
}

/** Duplikat tryout beserta subtes dan daftar soalnya sebagai draf baru. */
export async function duplikasiTryout(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const src = await prisma.exam.findFirst({ where: { id: parsed.data.id, deletedAt: null }, include: { sections: { include: { questions: true } } } });
    if (!src) return fail("Tryout tidak ditemukan.");
    let slug = `${src.slug}-salinan`;
    for (let i = 2; await prisma.exam.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${src.slug}-salinan-${i}`;
    const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, sections, ...data } = src;
    const copy = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({ data: { ...data, slug, title: `${src.title} (salinan)`, status: "DRAF" }, select: { id: true } });
      for (const s of sections) {
        const section = await tx.examSection.create({
          data: { examId: exam.id, title: s.title, order: s.order, durationMin: s.durationMin, weight: s.weight, passingGrade: s.passingGrade },
          select: { id: true },
        });
        if (s.questions.length) {
          await tx.examQuestion.createMany({
            data: s.questions.map((q) => ({ examId: exam.id, sectionId: section.id, questionId: q.questionId, order: q.order, weight: q.weight })),
          });
        }
      }
      return exam;
    });
    await audit(prisma, admin, "tryout.duplikasi", "Exam", copy.id, { before: { sumber: src.id } });
    revalidate();
    return ok(copy);
  });
}

/** Hapus tryout (soft delete). Riwayat nilai siswa tetap tersimpan. */
export async function hapusTryout(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const running = await prisma.examAttempt.count({ where: { examId: parsed.data.id, status: "BERLANGSUNG" } });
    if (running > 0) return fail(`Masih ada ${running} siswa yang sedang mengerjakan tryout ini. Coba lagi setelah selesai.`);
    const r = await prisma.exam.updateMany({ where: { id: parsed.data.id, deletedAt: null }, data: { deletedAt: new Date(), status: "ARSIP" } });
    if (r.count === 0) return fail("Tryout tidak ditemukan.");
    await audit(prisma, admin, "tryout.hapus", "Exam", parsed.data.id);
    revalidate();
    return ok(null);
  });
}

/** Tambah atau ubah subtes (M.6.7, I.4.14–I.4.15). */
export async function simpanSubtes(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = sectionSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { examId, id, ...data } = parsed.data;
    if (!(await prisma.exam.findFirst({ where: { id: examId, deletedAt: null }, select: { id: true } }))) return fail("Tryout tidak ditemukan.");
    if (id) {
      // Nama dan passing grade boleh diubah kapan pun; durasi dan bobot memengaruhi hasil.
      const before = await prisma.examSection.findFirst({ where: { id, examId } });
      if (!before) return fail("Subtes tidak ditemukan.");
      const structural = before.durationMin !== data.durationMin || before.weight !== data.weight;
      if (structural && (await structureLocked(examId))) return fail(LOCKED);
      await prisma.examSection.update({ where: { id }, data });
      await audit(prisma, admin, "tryout.subtes-ubah", "Exam", examId, { before, after: data });
      revalidate(examId);
      return ok({ id });
    }
    if (await structureLocked(examId)) return fail(LOCKED);
    const last = await prisma.examSection.findFirst({ where: { examId }, orderBy: { order: "desc" }, select: { order: true } });
    const created = await prisma.examSection.create({ data: { ...data, examId, order: (last?.order ?? 0) + 1 }, select: { id: true } });
    await audit(prisma, admin, "tryout.subtes-tambah", "Exam", examId, { after: data });
    revalidate(examId);
    return ok(created);
  });
}

export async function hapusSubtes(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const section = await prisma.examSection.findUnique({ where: { id: parsed.data.id }, select: { examId: true, title: true } });
    if (!section) return fail("Subtes tidak ditemukan.");
    if (await structureLocked(section.examId)) return fail(LOCKED);
    await prisma.$transaction(async (tx) => {
      await tx.examSection.delete({ where: { id: parsed.data.id } });
      // Rapatkan urutan agar tetap 1..n.
      const rest = await tx.examSection.findMany({ where: { examId: section.examId }, orderBy: { order: "asc" }, select: { id: true } });
      await tx.examSection.updateMany({ where: { examId: section.examId }, data: { order: { increment: 1000 } } });
      for (const [i, s] of rest.entries()) await tx.examSection.update({ where: { id: s.id }, data: { order: i + 1 } });
    });
    await audit(prisma, admin, "tryout.subtes-hapus", "Exam", section.examId, { before: { title: section.title } });
    revalidate(section.examId);
    return ok(null);
  });
}

export async function pindahSubtes(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = moveSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const section = await prisma.examSection.findUnique({ where: { id: parsed.data.id }, select: { examId: true, order: true } });
    if (!section) return fail("Subtes tidak ditemukan.");
    if (await structureLocked(section.examId)) return fail(LOCKED);
    const neighbor = await prisma.examSection.findFirst({
      where: { examId: section.examId, order: parsed.data.direction === "naik" ? { lt: section.order } : { gt: section.order } },
      orderBy: { order: parsed.data.direction === "naik" ? "desc" : "asc" },
      select: { id: true, order: true },
    });
    if (!neighbor) return ok(null);
    await prisma.$transaction([
      prisma.examSection.update({ where: { id: parsed.data.id }, data: { order: -1 } }),
      prisma.examSection.update({ where: { id: neighbor.id }, data: { order: section.order } }),
      prisma.examSection.update({ where: { id: parsed.data.id }, data: { order: neighbor.order } }),
    ]);
    await audit(prisma, admin, "tryout.subtes-urutan", "Exam", section.examId);
    revalidate(section.examId);
    return ok(null);
  });
}

/** Pencarian bank soal untuk dialog pilih soal (M.6.8). */
export async function cariSoalTryout(input: { examId: string; q?: string; categoryId?: string; subject?: string; difficulty?: string }) {
  return adminAction(async () => {
    if (typeof input?.examId !== "string") return fail("Tryout tidak dikenal.");
    const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);
    const rows = await searchQuestionsForExam(input.examId, {
      q: clean(input.q),
      categoryId: clean(input.categoryId),
      subject: clean(input.subject),
      difficulty: clean(input.difficulty),
    });
    return ok(rows);
  });
}

/** Tambah soal dari bank soal ke subtes (M.6.8). */
export async function tambahSoalTryout(input: unknown): Promise<ActionResult<{ added: number }>> {
  return adminAction(async (admin) => {
    const parsed = addQuestionsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const section = await prisma.examSection.findUnique({ where: { id: parsed.data.sectionId }, select: { examId: true } });
    if (!section) return fail("Subtes tidak ditemukan.");
    if (await structureLocked(section.examId)) return fail(LOCKED);
    const [existing, valid, last] = await Promise.all([
      prisma.examQuestion.findMany({ where: { examId: section.examId }, select: { questionId: true } }),
      prisma.question.findMany({ where: { id: { in: parsed.data.questionIds }, deletedAt: null }, select: { id: true } }),
      prisma.examQuestion.findFirst({ where: { sectionId: parsed.data.sectionId }, orderBy: { order: "desc" }, select: { order: true } }),
    ]);
    const taken = new Set(existing.map((e) => e.questionId));
    const validIds = new Set(valid.map((v) => v.id));
    const ids = parsed.data.questionIds.filter((id) => validIds.has(id) && !taken.has(id));
    if (ids.length === 0) return fail("Soal yang dipilih sudah ada di tryout ini atau sudah dihapus.");
    await prisma.examQuestion.createMany({
      data: ids.map((questionId, i) => ({ examId: section.examId, sectionId: parsed.data.sectionId, questionId, order: (last?.order ?? 0) + i + 1 })),
    });
    await audit(prisma, admin, "tryout.soal-tambah", "Exam", section.examId, { after: { sectionId: parsed.data.sectionId, questionIds: ids } });
    revalidate(section.examId);
    return ok({ added: ids.length });
  });
}

export async function keluarkanSoalTryout(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const eq = await prisma.examQuestion.findUnique({ where: { id: parsed.data.id }, select: { examId: true, questionId: true } });
    if (!eq) return fail("Soal tidak ada di tryout ini.");
    if (await structureLocked(eq.examId)) return fail(LOCKED);
    await prisma.examQuestion.delete({ where: { id: parsed.data.id } });
    await audit(prisma, admin, "tryout.soal-keluarkan", "Exam", eq.examId, { before: { questionId: eq.questionId } });
    revalidate(eq.examId);
    return ok(null);
  });
}

/** Simpan urutan soal satu subtes hasil seret-dan-lepas. */
export async function urutkanSoalTryout(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const rows = await prisma.examQuestion.findMany({ where: { sectionId: parsed.data.sectionId }, select: { id: true, examId: true } });
    if (rows.length === 0) return fail("Subtes tidak ditemukan.");
    const examId = rows[0].examId;
    if (await structureLocked(examId)) return fail(LOCKED);
    const known = new Set(rows.map((r) => r.id));
    if (parsed.data.ids.length !== rows.length || parsed.data.ids.some((id) => !known.has(id))) return fail("Daftar soal berubah. Muat ulang halaman lalu coba lagi.");
    await prisma.$transaction(parsed.data.ids.map((id, i) => prisma.examQuestion.update({ where: { id }, data: { order: i + 1 } })));
    await audit(prisma, admin, "tryout.soal-urutan", "Exam", examId);
    revalidate(examId);
    return ok(null);
  });
}

/** Bobot khusus soal di tryout ini (J.1.4); kosong = pakai bobot dari bank soal. */
export async function ubahBobotSoalTryout(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = questionWeightSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const eq = await prisma.examQuestion.findUnique({ where: { id: parsed.data.id }, select: { examId: true, weight: true } });
    if (!eq) return fail("Soal tidak ada di tryout ini.");
    if (await structureLocked(eq.examId)) return fail(LOCKED);
    await prisma.examQuestion.update({ where: { id: parsed.data.id }, data: { weight: parsed.data.weight } });
    await audit(prisma, admin, "tryout.soal-bobot", "Exam", eq.examId, { before: { weight: eq.weight }, after: { weight: parsed.data.weight } });
    revalidate(eq.examId);
    return ok(null);
  });
}
