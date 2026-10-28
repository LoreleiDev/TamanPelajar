"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { formatRetry, rateLimit } from "@/lib/rate-limit";
import { AuthorizationError, currentUser, requireRole } from "@/lib/rbac";

import { studentTestimonialSchema } from "./my-courses-schema";

// Tombol "Tambah kelas" dan testimoni siswa (revisi RMED).

async function student() {
  try {
    return { user: await requireRole("USER") } as const;
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) } as const;
    throw e;
  }
}

const courseIdSchema = z.object({ courseId: z.string().min(1) });

/**
 * Status Kelas Saya untuk tombol di halaman publik (dibaca di client agar halaman tetap statis):
 * kelas yang ditambahkan sendiri dan kelas dari paket aktif. Tamu dan admin mendapat daftar kosong.
 */
export async function statusKelasSaya(): Promise<{ saved: string[]; enrolled: string[] }> {
  const user = await currentUser();
  if (!user || user.role !== "USER") return { saved: [], enrolled: [] };
  const now = new Date();
  const [saved, enrolled] = await Promise.all([
    prisma.savedCourse.findMany({ where: { userId: user.id }, select: { courseId: true } }),
    prisma.productCourse.findMany({
      where: { product: { enrollments: { some: { userId: user.id, status: "AKTIF", expiresAt: { gt: now } } } } },
      select: { courseId: true },
    }),
  ]);
  return { saved: saved.map((s) => s.courseId), enrolled: [...new Set(enrolled.map((e) => e.courseId))] };
}

/** Tambahkan kelas terbit ke Kelas Saya. Akses bab berbayar tetap butuh paket. */
export async function tambahKelasSaya(input: unknown): Promise<ActionResult<null>> {
  const s = await student();
  if (s.error) return s.error;
  const parsed = courseIdSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const course = await prisma.course.findFirst({ where: { id: parsed.data.courseId, status: "TERBIT", deletedAt: null }, select: { id: true } });
  if (!course) return fail("Kelas tidak ditemukan.");
  await prisma.savedCourse.upsert({
    where: { userId_courseId: { userId: s.user.id, courseId: course.id } },
    create: { userId: s.user.id, courseId: course.id },
    update: {},
  });
  revalidatePath("/dashboard/kelas");
  return ok(null);
}

/** Keluarkan kelas dari Kelas Saya (progres belajar tetap tersimpan). */
export async function hapusKelasSaya(input: unknown): Promise<ActionResult<null>> {
  const s = await student();
  if (s.error) return s.error;
  const parsed = courseIdSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  await prisma.savedCourse.deleteMany({ where: { userId: s.user.id, courseId: parsed.data.courseId } });
  revalidatePath("/dashboard/kelas");
  return ok(null);
}

/**
 * Testimoni siswa setelah menyelesaikan satu kelas 100%. Masuk sebagai "menunggu" dan baru
 * tampil di beranda setelah admin menerbitkannya. Satu testimoni per kelas; mengirim ulang
 * memperbarui testimoni yang belum diterbitkan.
 */
export async function kirimTestimoni(input: unknown): Promise<ActionResult<null>> {
  const s = await student();
  if (s.error) return s.error;
  const parsed = studentTestimonialSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const limit = await rateLimit(`testimoni:${s.user.id}`, 10, 60 * 60);
  if (!limit.allowed) return fail(`Terlalu banyak percobaan. Coba lagi dalam ${formatRetry(limit.retryAfterSec)}.`);

  const { courseId, opening, body } = parsed.data;
  const [course, total, done, existing] = await Promise.all([
    prisma.course.findFirst({ where: { id: courseId, deletedAt: null }, select: { title: true } }),
    prisma.lesson.count({ where: { section: { courseId } } }),
    prisma.lessonProgress.count({ where: { userId: s.user.id, completedAt: { not: null }, lesson: { section: { courseId } } } }),
    prisma.testimonial.findUnique({ where: { userId_courseId: { userId: s.user.id, courseId } }, select: { isPublished: true } }),
  ]);
  if (!course) return fail("Kelas tidak ditemukan.");
  if (total === 0 || done < total) return fail("Testimoni bisa dikirim setelah semua materi kelas ini selesai.");
  if (existing?.isPublished) return fail("Testimonimu untuk kelas ini sudah diterbitkan. Terima kasih!");

  await prisma.testimonial.upsert({
    where: { userId_courseId: { userId: s.user.id, courseId } },
    create: { userId: s.user.id, courseId, name: s.user.name, program: course.title, opening, body, isPublished: false, isPending: true },
    update: { opening, body, isPending: true },
  });
  revalidatePath("/admin/testimoni");
  updateTag("katalog");
  return ok(null);
}
