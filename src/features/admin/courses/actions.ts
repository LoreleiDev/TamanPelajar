"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { slugify } from "../form-rules";
import { adminAction, audit } from "../guard";
import { resolveSubject } from "../subjects";
import { searchQuestionsForQuiz } from "./search";
import {
  courseSchema,
  idSchema,
  lessonCreateSchema,
  lessonSchema,
  materialSchema,
  quizSettingsSchema,
  reorderSchema,
  sectionCreateSchema,
  sectionUpdateSchema,
} from "./schemas";

// Pengelolaan kelas oleh admin (L.1, L.2.1–L.2.5, L.2.10). Setiap perubahan memperbarui
// cache katalog publik dan perkiraan durasi kelas.

const refresh = (courseId?: string) => {
  revalidatePath("/admin/kelas");
  if (courseId) revalidatePath(`/admin/kelas/${courseId}`, "layout");
  updateTag("katalog");
};

/** Hitung ulang perkiraan durasi kelas dari durasi materi. */
async function syncEstimate(courseId: string) {
  const sum = await prisma.lesson.aggregate({ where: { section: { courseId } }, _sum: { durationSec: true } });
  await prisma.course.update({ where: { id: courseId }, data: { estimatedMinutes: Math.ceil((sum._sum.durationSec ?? 0) / 60) } });
}

async function courseOfSection(sectionId: string) {
  return (await prisma.courseSection.findUnique({ where: { id: sectionId }, select: { courseId: true } }))?.courseId ?? null;
}

/** Slug materi unik di dalam satu bab. */
async function uniqueLessonSlug(sectionId: string, base: string, exceptId?: string) {
  let slug = base || "materi";
  for (let i = 2; ; i++) {
    const clash = await prisma.lesson.findFirst({ where: { sectionId, slug, ...(exceptId && { id: { not: exceptId } }) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${base}-${i}`;
  }
}

/** Buat atau ubah kelas (L.2.1); sertifikat kelas (G.4.6) diaktifkan dari sini. */
export async function simpanKelas(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = courseSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, certificate, ...fields } = parsed.data;
    const subject = await resolveSubject(fields.subject);
    if (!subject) return fail("Mata pelajaran belum terdaftar.", { subject: "Pilih mata pelajaran dari daftar" });
    const data = { ...fields, subject };
    const clash = await prisma.course.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash && clash.id !== id) return fail("Slug sudah dipakai kelas lain.", { slug: "Slug ini sudah dipakai" });

    const courseId = id
      ? (await prisma.course.update({ where: { id }, data, select: { id: true } })).id
      : (await prisma.course.create({ data, select: { id: true } })).id;
    const cert = await prisma.certificate.findUnique({ where: { courseId }, select: { id: true, _count: { select: { issued: true } } } });
    if (certificate && !cert) await prisma.certificate.create({ data: { courseId, title: `Sertifikat ${data.title}` } });
    if (!certificate && cert) {
      if (cert._count.issued > 0) return fail("Sertifikat kelas ini sudah diterbitkan untuk siswa, jadi tidak bisa dimatikan.", { certificate: "Sudah ada sertifikat terbit" });
      await prisma.certificate.delete({ where: { id: cert.id } });
    }
    await audit(prisma, admin, id ? "kelas.ubah" : "kelas.buat", "Course", courseId, { after: { ...data, certificate } });
    refresh(courseId);
    return ok({ id: courseId });
  });
}

/** Hapus kelas (soft delete). Kelas hilang dari katalog dan paket; progres siswa tetap tersimpan. */
export async function hapusKelas(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const r = await prisma.course.updateMany({ where: { id: parsed.data.id, deletedAt: null }, data: { deletedAt: new Date(), status: "ARSIP" } });
    if (r.count === 0) return fail("Kelas tidak ditemukan.");
    await audit(prisma, admin, "kelas.hapus", "Course", parsed.data.id);
    refresh();
    return ok(null);
  });
}

export async function tambahBab(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = sectionCreateSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { courseId, title } = parsed.data;
    const last = await prisma.courseSection.findFirst({ where: { courseId }, orderBy: { order: "desc" }, select: { order: true } });
    const order = (last?.order ?? -1) + 1;
    // Bab 1 dan 2 gratis secara bawaan (G.4.10, L.2.10).
    await prisma.courseSection.create({ data: { courseId, title, order, isFree: order < 2 } });
    await audit(prisma, admin, "kelas.bab-tambah", "Course", courseId, { after: { title } });
    refresh(courseId);
    return ok(null);
  });
}

/** Ubah judul bab dan tanda gratis (L.2.10). */
export async function ubahBab(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = sectionUpdateSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const before = await prisma.courseSection.findUnique({ where: { id: parsed.data.id }, select: { courseId: true, title: true, isFree: true } });
    if (!before) return fail("Bab tidak ditemukan.");
    await prisma.courseSection.update({ where: { id: parsed.data.id }, data: { title: parsed.data.title, isFree: parsed.data.isFree } });
    await audit(prisma, admin, "kelas.bab-ubah", "Course", before.courseId, { before, after: parsed.data });
    refresh(before.courseId);
    return ok(null);
  });
}

export async function hapusBab(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const s = await prisma.courseSection.findUnique({ where: { id: parsed.data.id }, select: { courseId: true, title: true, _count: { select: { lessons: true } } } });
    if (!s) return fail("Bab tidak ditemukan.");
    if (s._count.lessons > 0) return fail("Kosongkan bab dulu: hapus atau pindahkan materinya ke bab lain.");
    await prisma.$transaction(async (tx) => {
      await tx.courseSection.delete({ where: { id: parsed.data.id } });
      const rest = await tx.courseSection.findMany({ where: { courseId: s.courseId }, orderBy: { order: "asc" }, select: { id: true } });
      await tx.courseSection.updateMany({ where: { courseId: s.courseId }, data: { order: { increment: 1000 } } });
      for (const [i, r] of rest.entries()) await tx.courseSection.update({ where: { id: r.id }, data: { order: i } });
    });
    await audit(prisma, admin, "kelas.bab-hapus", "Course", s.courseId, { before: { title: s.title } });
    refresh(s.courseId);
    return ok(null);
  });
}

/** Urutan bab hasil seret-dan-lepas (L.2.2). */
export async function urutkanBab(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const courseId = parsed.data.parentId;
    const rows = await prisma.courseSection.findMany({ where: { courseId }, select: { id: true } });
    const known = new Set(rows.map((r) => r.id));
    if (rows.length !== parsed.data.ids.length || parsed.data.ids.some((id) => !known.has(id))) return fail("Daftar bab berubah. Muat ulang halaman lalu coba lagi.");
    await prisma.$transaction([
      prisma.courseSection.updateMany({ where: { courseId }, data: { order: { increment: 1000 } } }),
      ...parsed.data.ids.map((id, i) => prisma.courseSection.update({ where: { id }, data: { order: i } })),
    ]);
    await audit(prisma, admin, "kelas.bab-urutan", "Course", courseId);
    refresh(courseId);
    return ok(null);
  });
}

/** Tambah materi ke bab; kuis langsung dibuatkan wadahnya. */
export async function tambahMateri(input: unknown): Promise<ActionResult<{ id: string; courseId: string }>> {
  return adminAction(async (admin) => {
    const parsed = lessonCreateSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { sectionId, title, type } = parsed.data;
    const courseId = await courseOfSection(sectionId);
    if (!courseId) return fail("Bab tidak ditemukan.");
    const last = await prisma.lesson.findFirst({ where: { sectionId }, orderBy: { order: "desc" }, select: { order: true } });
    const slug = await uniqueLessonSlug(sectionId, slugify(title));
    const quiz = type === "KUIS" ? await prisma.quiz.create({ data: { title, passingScore: 70 }, select: { id: true } }) : null;
    const lesson = await prisma.lesson.create({
      data: { sectionId, title, slug, type, order: (last?.order ?? -1) + 1, quizId: quiz?.id ?? null },
      select: { id: true },
    });
    await audit(prisma, admin, "kelas.materi-tambah", "Course", courseId, { after: { title, type } });
    refresh(courseId);
    return ok({ id: lesson.id, courseId });
  });
}

/** Ubah materi (L.2.3–L.2.5): isi, video dari pustaka, durasi, pindah bab. */
export async function simpanMateri(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = lessonSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const v = parsed.data;
    const before = await prisma.lesson.findUnique({ where: { id: v.id }, select: { sectionId: true, quizId: true, type: true, section: { select: { courseId: true } } } });
    if (!before) return fail("Materi tidak ditemukan.");
    const targetCourse = await courseOfSection(v.sectionId);
    if (targetCourse !== before.section.courseId) return fail("Materi hanya bisa dipindah ke bab di kelas yang sama.");
    const slug = await uniqueLessonSlug(v.sectionId, v.slug, v.id);
    if (slug !== v.slug) return fail("Slug sudah dipakai materi lain di bab ini.", { slug: `Coba ${slug}` });

    const video = v.type === "VIDEO" ? await prisma.video.findUnique({ where: { id: v.videoId }, select: { durationSec: true } }) : null;
    if (v.type === "VIDEO" && !video) return fail("Video tidak ditemukan.", { videoId: "Pilih video lain" });
    // Pindah bab: taruh di akhir bab tujuan.
    const order =
      v.sectionId !== before.sectionId
        ? ((await prisma.lesson.findFirst({ where: { sectionId: v.sectionId }, orderBy: { order: "desc" }, select: { order: true } }))?.order ?? -1) + 1
        : undefined;
    const quizId = v.type === "KUIS" ? (before.quizId ?? (await prisma.quiz.create({ data: { title: v.title, passingScore: 70 }, select: { id: true } })).id) : before.quizId;

    await prisma.lesson.update({
      where: { id: v.id },
      data: {
        sectionId: v.sectionId,
        title: v.title,
        slug: v.slug,
        summary: v.summary || null,
        type: v.type,
        content: v.content || null,
        videoId: v.type === "VIDEO" ? v.videoId : null,
        durationSec: video ? video.durationSec : v.durationMin === null ? null : v.durationMin * 60,
        quizId,
        ...(order !== undefined && { order }),
      },
    });
    await syncEstimate(before.section.courseId);
    await audit(prisma, admin, "kelas.materi-ubah", "Lesson", v.id, { before: { type: before.type, sectionId: before.sectionId }, after: { title: v.title, type: v.type, sectionId: v.sectionId } });
    refresh(before.section.courseId);
    return ok(null);
  });
}

export async function hapusMateri(input: unknown): Promise<ActionResult<{ courseId: string }>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const l = await prisma.lesson.findUnique({ where: { id: parsed.data.id }, select: { title: true, quizId: true, section: { select: { courseId: true } } } });
    if (!l) return fail("Materi tidak ditemukan.");
    await prisma.$transaction(async (tx) => {
      await tx.lesson.delete({ where: { id: parsed.data.id } });
      if (l.quizId) await tx.quiz.delete({ where: { id: l.quizId } });
    });
    await syncEstimate(l.section.courseId);
    await audit(prisma, admin, "kelas.materi-hapus", "Course", l.section.courseId, { before: { title: l.title } });
    refresh(l.section.courseId);
    return ok({ courseId: l.section.courseId });
  });
}

/** Urutan materi dalam satu bab (L.2.2). */
export async function urutkanMateri(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const sectionId = parsed.data.parentId;
    const rows = await prisma.lesson.findMany({ where: { sectionId }, select: { id: true, section: { select: { courseId: true } } } });
    const known = new Set(rows.map((r) => r.id));
    if (rows.length === 0 || rows.length !== parsed.data.ids.length || parsed.data.ids.some((id) => !known.has(id))) {
      return fail("Daftar materi berubah. Muat ulang halaman lalu coba lagi.");
    }
    await prisma.$transaction(parsed.data.ids.map((id, i) => prisma.lesson.update({ where: { id }, data: { order: i } })));
    await audit(prisma, admin, "kelas.materi-urutan", "Course", rows[0].section.courseId);
    refresh(rows[0].section.courseId);
    return ok(null);
  });
}

/** Lampiran PDF materi (L.2.3, G.2.3); file sudah diunggah sebagai Media authenticated. */
export async function tambahLampiran(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = materialSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const media = await prisma.media.findUnique({ where: { id: parsed.data.mediaId }, select: { format: true, deliveryType: true } });
    if (!media || media.format !== "pdf") return fail("Lampiran harus PDF yang diunggah lewat formulir ini.");
    const lesson = await prisma.lesson.findUnique({ where: { id: parsed.data.lessonId }, select: { section: { select: { courseId: true } } } });
    if (!lesson) return fail("Materi tidak ditemukan.");
    await prisma.material.create({ data: parsed.data });
    await audit(prisma, admin, "kelas.lampiran-tambah", "Lesson", parsed.data.lessonId, { after: { title: parsed.data.title } });
    refresh(lesson.section.courseId);
    return ok(null);
  });
}

export async function hapusLampiran(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const m = await prisma.material.findUnique({ where: { id: parsed.data.id }, select: { title: true, lessonId: true, lesson: { select: { section: { select: { courseId: true } } } } } });
    if (!m) return fail("Lampiran tidak ditemukan.");
    await prisma.material.delete({ where: { id: parsed.data.id } });
    await audit(prisma, admin, "kelas.lampiran-hapus", "Lesson", m.lessonId, { before: { title: m.title } });
    refresh(m.lesson.section.courseId);
    return ok(null);
  });
}

/** Pengaturan kuis materi (L.2.5). */
export async function simpanKuis(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = quizSettingsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    await prisma.quiz.update({ where: { id: parsed.data.quizId }, data: { title: parsed.data.title, passingScore: parsed.data.passingScore } });
    await audit(prisma, admin, "kuis.ubah", "Quiz", parsed.data.quizId, { after: parsed.data });
    revalidatePath("/admin/kelas", "layout");
    return ok(null);
  });
}

export async function cariSoalKuis(input: { quizId: string; q?: string; categoryId?: string; subject?: string; difficulty?: string }) {
  return adminAction(async () => {
    if (typeof input?.quizId !== "string") return fail("Kuis tidak dikenal.");
    const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);
    return ok(await searchQuestionsForQuiz(input.quizId, { q: clean(input.q), categoryId: clean(input.categoryId), subject: clean(input.subject), difficulty: clean(input.difficulty) }));
  });
}

export async function tambahSoalKuis(input: unknown): Promise<ActionResult<{ added: number }>> {
  return adminAction(async (admin) => {
    const parsed = z.object({ quizId: z.string().min(1), questionIds: z.array(z.string().min(1)).min(1).max(100) }).safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { quizId, questionIds } = parsed.data;
    const [existing, valid, last] = await Promise.all([
      prisma.quizQuestion.findMany({ where: { quizId }, select: { questionId: true } }),
      prisma.question.findMany({ where: { id: { in: questionIds }, deletedAt: null, type: { not: "ESSAY" } }, select: { id: true } }),
      prisma.quizQuestion.findFirst({ where: { quizId }, orderBy: { order: "desc" }, select: { order: true } }),
    ]);
    const taken = new Set(existing.map((e) => e.questionId));
    const ids = valid.map((v) => v.id).filter((id) => !taken.has(id));
    if (ids.length === 0) return fail("Soal yang dipilih sudah ada di kuis atau tidak bisa dipakai (essay tidak dinilai otomatis).");
    await prisma.quizQuestion.createMany({ data: ids.map((questionId, i) => ({ quizId, questionId, order: (last?.order ?? -1) + i + 1 })) });
    await audit(prisma, admin, "kuis.soal-tambah", "Quiz", quizId, { after: { questionIds: ids } });
    revalidatePath("/admin/kelas", "layout");
    return ok({ added: ids.length });
  });
}

export async function keluarkanSoalKuis(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const qq = await prisma.quizQuestion.delete({ where: { id: parsed.data.id }, select: { quizId: true, questionId: true } });
    await audit(prisma, admin, "kuis.soal-keluarkan", "Quiz", qq.quizId, { before: { questionId: qq.questionId } });
    revalidatePath("/admin/kelas", "layout");
    return ok(null);
  });
}

export async function urutkanSoalKuis(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const quizId = parsed.data.parentId;
    const rows = await prisma.quizQuestion.findMany({ where: { quizId }, select: { id: true } });
    const known = new Set(rows.map((r) => r.id));
    if (rows.length !== parsed.data.ids.length || parsed.data.ids.some((id) => !known.has(id))) return fail("Daftar soal berubah. Muat ulang halaman lalu coba lagi.");
    await prisma.$transaction(parsed.data.ids.map((id, i) => prisma.quizQuestion.update({ where: { id }, data: { order: i } })));
    await audit(prisma, admin, "kuis.soal-urutan", "Quiz", quizId);
    revalidatePath("/admin/kelas", "layout");
    return ok(null);
  });
}
