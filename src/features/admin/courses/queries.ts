import type { Prisma } from "@/generated/prisma/client";
import { imageUrl } from "@/lib/cloudinary";
import { toJakartaInput } from "@/lib/datetime";
import { formatTanggal } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "../guard";

/** Daftar kelas admin (L.2.1). */
export async function listAdminCourses(filter: { q?: string; status?: "DRAF" | "TERBIT" | "ARSIP" }) {
  await adminOnly();
  const where: Prisma.CourseWhereInput = {
    deletedAt: null,
    ...(filter.status && { status: filter.status }),
    ...(filter.q && { OR: [{ title: { contains: filter.q } }, { subject: { contains: filter.q } }] }),
  };
  const rows = await prisma.course.findMany({
    where,
    orderBy: [{ status: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      subject: true,
      status: true,
      estimatedMinutes: true,
      category: { select: { shortName: true } },
      sections: { select: { isFree: true, _count: { select: { lessons: true } } } },
      _count: { select: { products: true } },
    },
  });
  return rows.map(({ sections, _count, category, ...c }) => ({
    ...c,
    category: category.shortName,
    sectionCount: sections.length,
    freeSections: sections.filter((s) => s.isFree).length,
    lessonCount: sections.reduce((n, s) => n + s._count.lessons, 0),
    products: _count.products,
  }));
}

/** Kelas lengkap untuk halaman ubah: pengaturan dan kurikulum. */
export async function getAdminCourse(id: string) {
  await adminOnly();
  const c = await prisma.course.findFirst({
    where: { id, deletedAt: null },
    include: {
      thumbnail: { select: { publicId: true } },
      certificate: { select: { id: true, _count: { select: { issued: true } } } },
      category: { select: { name: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              slug: true,
              title: true,
              type: true,
              durationSec: true,
              video: { select: { title: true } },
              quiz: { select: { _count: { select: { questions: true } } } },
              _count: { select: { materials: true, progress: true } },
            },
          },
        },
      },
    },
  });
  if (!c) return null;
  return { ...c, thumbnailUrl: c.thumbnail ? imageUrl(c.thumbnail.publicId, 640) : null };
}

export type AdminCourse = NonNullable<Awaited<ReturnType<typeof getAdminCourse>>>;

/** Satu materi untuk halaman ubah materi (L.2.3–L.2.5). */
export async function getAdminLesson(courseId: string, lessonId: string) {
  await adminOnly();
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, section: { courseId } },
    include: {
      section: { select: { id: true, title: true, course: { select: { id: true, title: true, slug: true, categoryId: true, sections: { orderBy: { order: "asc" }, select: { id: true, title: true } } } } } },
      materials: { orderBy: { createdAt: "asc" }, select: { id: true, title: true, media: { select: { bytes: true } } } },
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: { id: true, question: { select: { id: true, body: true, type: true, topic: true, difficulty: true, status: true, deletedAt: true } } },
          },
          _count: { select: { attempts: true } },
        },
      },
    },
  });
  return lesson;
}

/** Peserta kelas dan progresnya (C.2.5, L.2.6): yang punya akses lewat paket atau pernah membuka materi. */
export async function getCourseParticipants(courseId: string) {
  await adminOnly();
  const [lessonTotal, enrolled, progress] = await Promise.all([
    prisma.lesson.count({ where: { section: { courseId } } }),
    prisma.enrollment.findMany({
      where: { product: { courses: { some: { courseId } } } },
      select: { userId: true, status: true, expiresAt: true, user: { select: { name: true, email: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { lesson: { section: { courseId } } },
      select: { userId: true, completedAt: true, updatedAt: true, watchedSec: true, user: { select: { name: true, email: true } } },
    }),
  ]);
  const map = new Map<string, { id: string; name: string; email: string; access: string | null; expiresAt: Date | null; done: number; watchedSec: number; last: Date | null }>();
  for (const e of enrolled) {
    const cur = map.get(e.userId);
    const active = e.status === "AKTIF" && e.expiresAt > new Date();
    if (!cur || active) {
      map.set(e.userId, { id: e.userId, name: e.user.name, email: e.user.email, access: active ? "Aktif" : "Berakhir", expiresAt: e.expiresAt, done: cur?.done ?? 0, watchedSec: cur?.watchedSec ?? 0, last: cur?.last ?? null });
    }
  }
  for (const p of progress) {
    const cur = map.get(p.userId) ?? { id: p.userId, name: p.user.name, email: p.user.email, access: null, expiresAt: null, done: 0, watchedSec: 0, last: null };
    cur.done += p.completedAt ? 1 : 0;
    cur.watchedSec += p.watchedSec;
    if (!cur.last || p.updatedAt > cur.last) cur.last = p.updatedAt;
    map.set(p.userId, cur);
  }
  const rows = [...map.values()].sort((a, b) => (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0));
  return { lessonTotal, rows };
}

/** Batch kelas untuk tab Batch (revisi RMED): periode WIB, fase, dan ringkasan peserta. */
export async function getCourseBatches(courseId: string, now = new Date()) {
  await adminOnly();
  const rows = await prisma.courseBatch.findMany({
    where: { courseId },
    orderBy: { startsAt: "desc" },
    select: { id: true, name: true, startsAt: true, endsAt: true, participants: { select: { status: true } } },
  });
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    startsOn: toJakartaInput(b.startsAt).slice(0, 10),
    endsOn: toJakartaInput(b.endsAt).slice(0, 10),
    period: `${formatTanggal(b.startsAt)} – ${formatTanggal(b.endsAt)}`,
    phase: (b.startsAt > now ? "akan-datang" : b.endsAt < now ? "selesai" : "berjalan") as "berjalan" | "akan-datang" | "selesai",
    participants: b.participants.length,
    passed: b.participants.filter((p) => p.status === "LULUS").length,
    waiting: b.participants.filter((p) => p.status === "MENUNGGU_PENILAIAN").length,
  }));
}
