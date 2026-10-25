import type { Prisma } from "@/generated/prisma/client";
import { imageUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

const PAGE_SIZE = 25;

/** Pustaka video untuk admin (L.2.4), termasuk draf dan arsip. */
export async function listAdminVideos(filter: { q?: string; category?: string; status?: "DRAF" | "TERBIT" | "ARSIP"; page: number }) {
  await adminOnly();
  const where: Prisma.VideoWhereInput = {
    ...(filter.status && { status: filter.status }),
    ...(filter.category && { category: { slug: filter.category } }),
    ...(filter.q && { OR: [{ title: { contains: filter.q } }, { subject: { contains: filter.q } }] }),
  };
  const [total, rows] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        subject: true,
        provider: true,
        durationSec: true,
        status: true,
        category: { select: { shortName: true } },
        _count: { select: { lessons: true, progress: true } },
      },
    }),
  ]);
  return { rows, total, page: filter.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getAdminVideo(id: string) {
  await adminOnly();
  const v = await prisma.video.findUnique({
    where: { id },
    include: {
      thumbnail: { select: { publicId: true } },
      lessons: { select: { id: true, title: true, section: { select: { course: { select: { id: true, title: true } } } } } },
      _count: { select: { progress: true } },
    },
  });
  return v ? { ...v, thumbnailUrl: v.thumbnail ? imageUrl(v.thumbnail.publicId, 640) : null } : null;
}

/** Pilihan video untuk materi kelas bertipe video. */
export async function listVideoOptions() {
  await adminOnly();
  return prisma.video.findMany({ where: { status: { not: "ARSIP" } }, orderBy: [{ subject: "asc" }, { title: "asc" }], select: { id: true, title: true, subject: true, durationSec: true } });
}
