import { imageUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "../guard";

/** Daftar paket untuk admin (M.4), termasuk draf dan arsip. */
export async function listAdminProducts(filter: { q?: string; status?: "DRAF" | "TERBIT" | "ARSIP" }) {
  await adminOnly();
  const rows = await prisma.product.findMany({
    where: { deletedAt: null, ...(filter.status && { status: filter.status }), ...(filter.q && { name: { contains: filter.q } }) },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      programType: true,
      price: true,
      promoPrice: true,
      activeDays: true,
      status: true,
      salesCount: true,
      category: { select: { shortName: true } },
      _count: { select: { courses: true, exams: true, videos: true, enrollments: { where: { status: "AKTIF" } } } },
    },
  });
  return rows;
}

export async function getAdminProduct(id: string) {
  await adminOnly();
  const p = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      thumbnail: { select: { publicId: true } },
      courses: { orderBy: { order: "asc" }, select: { courseId: true } },
      exams: { orderBy: { order: "asc" }, select: { examId: true } },
      videos: { select: { videoId: true } },
      _count: { select: { enrollments: { where: { status: "AKTIF" } }, orderItems: true } },
    },
  });
  return p ? { ...p, thumbnailUrl: p.thumbnail ? imageUrl(p.thumbnail.publicId, 640) : null } : null;
}

/** Isi yang bisa dimasukkan ke paket (M.4: kelas dan tryout yang termasuk). */
export async function getProductContentOptions() {
  await adminOnly();
  const [courses, exams, videos] = await Promise.all([
    prisma.course.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true, status: true, category: { select: { shortName: true } } } }),
    prisma.exam.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true, status: true, category: { select: { shortName: true } } } }),
    prisma.video.findMany({ where: { status: { not: "ARSIP" }, lessons: { none: {} } }, orderBy: { title: "asc" }, select: { id: true, title: true, status: true, category: { select: { shortName: true } } } }),
  ]);
  const shape = (r: { id: string; title: string; status: string; category: { shortName: string } }) => ({ id: r.id, label: r.title, hint: `${r.category.shortName}${r.status !== "TERBIT" ? " · draf" : ""}` });
  return { courses: courses.map(shape), exams: exams.map(shape), videos: videos.map(shape) };
}
