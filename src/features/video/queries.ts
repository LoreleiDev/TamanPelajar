// Pustaka dan halaman video (H). Daftar dihitung per request karena status tonton dan
// akses bergantung pada pengguna; jumlah video masih kecil sehingga difilter di server.

import { cacheLife, cacheTag } from "next/cache";

import type { LessonAccess } from "@/lib/access-rules";
import { prisma } from "@/lib/prisma";
import { canAccessVideo } from "@/lib/video-access";

import { DURATION_BUCKETS, type VideoFilter } from "./schemas";

export const VIDEO_PAGE_SIZE = 12;

type User = { id: string; role: "ADMIN" | "USER" } | null;

export interface VideoCardData {
  slug: string;
  title: string;
  subject: string;
  category: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  durationSec: number;
  access: LessonAccess;
  free: boolean;
  watched: boolean;
  progressPercent: number;
}

const published = { status: "TERBIT" } as const;

async function enrolledCourseIds(userId: string) {
  const rows = await prisma.enrollment.findMany({
    where: { userId, status: "AKTIF", expiresAt: { gt: new Date() } },
    select: { product: { select: { courses: { select: { courseId: true } }, videos: { select: { videoId: true } } } } },
  });
  return {
    courses: new Set(rows.flatMap((r) => r.product.courses.map((c) => c.courseId))),
    videos: new Set(rows.flatMap((r) => r.product.videos.map((v) => v.videoId))),
  };
}

/** Judul dan deskripsi untuk metadata halaman video (publik, di-cache). */
export async function getVideoMeta(slug: string) {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  return prisma.video.findFirst({ where: { slug, ...published }, select: { title: true, description: true } });
}

export async function listVideoSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  const rows = await prisma.video.findMany({ where: published, select: { slug: true } });
  return rows.map((r) => r.slug);
}

/** Pustaka video dengan filter (H.1). */
export async function searchVideos(filter: VideoFilter, user: User) {
  const [videos, facets] = await Promise.all([
    prisma.video.findMany({
      where: published,
      orderBy: [{ category: { order: "asc" } }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        subject: true,
        difficulty: true,
        durationSec: true,
        category: { select: { name: true } },
        lessons: { select: { id: true, section: { select: { isFree: true, courseId: true } } } },
        _count: { select: { products: true } },
      },
    }),
    listVideoFacets(),
  ]);

  const enrolled = user && user.role !== "ADMIN" ? await enrolledCourseIds(user.id) : null;
  const [videoProgress, lessonDone] = user
    ? await Promise.all([
        prisma.videoProgress.findMany({ where: { userId: user.id }, select: { videoId: true, completedAt: true, watchedSec: true } }),
        prisma.lessonProgress.findMany({ where: { userId: user.id, completedAt: { not: null } }, select: { lessonId: true } }),
      ])
    : [[], []];
  const vp = new Map(videoProgress.map((p) => [p.videoId, p]));
  const doneLessons = new Set(lessonDone.map((l) => l.lessonId));

  const cards: VideoCardData[] = videos.map((v) => {
    const free = v.lessons.some((l) => l.section.isFree) || (v.lessons.length === 0 && v._count.products === 0);
    let access: LessonAccess = "perlu-masuk";
    if (user) {
      access =
        user.role === "ADMIN" || free || v.lessons.some((l) => enrolled?.courses.has(l.section.courseId)) || enrolled?.videos.has(v.id)
          ? "terbuka"
          : "perlu-langganan";
    }
    const p = vp.get(v.id);
    const watched = Boolean(p?.completedAt) || v.lessons.some((l) => doneLessons.has(l.id));
    return {
      slug: v.slug,
      title: v.title,
      subject: v.subject,
      category: v.category.name,
      difficulty: v.difficulty,
      durationSec: v.durationSec,
      access,
      free,
      watched,
      progressPercent: watched ? 100 : p ? Math.min(99, Math.round((p.watchedSec / Math.max(1, v.durationSec)) * 100)) : 0,
    };
  });

  const words = filter.q?.toLocaleLowerCase("id-ID").split(/\s+/).filter(Boolean) ?? [];
  const bucket = filter.durasi ? DURATION_BUCKETS[filter.durasi] : null;
  const filtered = cards.filter(
    (c) =>
      words.every((w) => `${c.title} ${c.subject}`.toLocaleLowerCase("id-ID").includes(w)) &&
      (!filter.kategori || c.category === filter.kategori) &&
      (!filter.mapel || c.subject === filter.mapel) &&
      (!filter.kesulitan || c.difficulty === filter.kesulitan) &&
      (!bucket || (c.durationSec >= ("min" in bucket ? bucket.min : 0) && c.durationSec < ("max" in bucket ? bucket.max : Infinity))) &&
      (!filter.status || (filter.status === "sudah" ? c.watched : !c.watched)),
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / VIDEO_PAGE_SIZE));
  const page = Math.min(filter.halaman, pageCount);
  return {
    items: filtered.slice((page - 1) * VIDEO_PAGE_SIZE, page * VIDEO_PAGE_SIZE),
    total: filtered.length,
    page,
    pageCount,
    facets,
  };
}

async function listVideoFacets() {
  const rows = await prisma.video.findMany({
    where: published,
    select: { subject: true, category: { select: { name: true, order: true } } },
  });
  const categories = [...new Map(rows.map((r) => [r.category.name, r.category.order])).entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);
  const subjects = [...new Set(rows.map((r) => r.subject))].sort((a, b) => a.localeCompare(b, "id"));
  return { categories, subjects };
}

export interface VideoPageData {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  durationSec: number;
  access: LessonAccess;
  /** Hanya terisi bila akses terbuka (URL dan transkrip tidak dikirim untuk video terkunci). */
  player: { provider: "YOUTUBE" | "VIMEO" | "EKSTERNAL"; url: string; durationSec: number } | null;
  transcript: string | null;
  note: string;
  bookmarked: boolean;
  lastPositionSec: number;
  progressPercent: number;
  watched: boolean;
  course: { slug: string; title: string; lessonSlug: string } | null;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  related: { slug: string; title: string; durationSec: number }[];
  products: { slug: string; name: string; price: number; promoPrice: number | null; activeDays: number }[];
}

/** Halaman video (H.2). */
export async function getVideoPage(slug: string, user: User): Promise<VideoPageData | null> {
  const v = await prisma.video.findFirst({
    where: { slug, ...published },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      subject: true,
      difficulty: true,
      durationSec: true,
      category: { select: { name: true } },
      lessons: {
        take: 1,
        select: {
          slug: true,
          section: {
            select: {
              course: {
                select: {
                  slug: true,
                  title: true,
                  sections: {
                    orderBy: { order: "asc" },
                    select: { lessons: { orderBy: { order: "asc" }, select: { video: { select: { slug: true, title: true, status: true } } } } },
                  },
                  products: {
                    where: { product: { status: "TERBIT", deletedAt: null } },
                    select: { product: { select: { slug: true, name: true, price: true, promoPrice: true, activeDays: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!v) return null;

  const access = await canAccessVideo(user, v.id);
  const open = access === "terbuka" && user;
  const course = v.lessons[0]?.section.course ?? null;

  const [full, progress] = open
    ? await Promise.all([
        prisma.video.findUniqueOrThrow({
          where: { id: v.id },
          select: {
            provider: true,
            url: true,
            transcript: true,
            notes: { where: { userId: user.id }, select: { content: true } },
            bookmarks: { where: { userId: user.id }, select: { id: true } },
            lessons: { select: { progress: { where: { userId: user.id, completedAt: { not: null } }, select: { id: true } } } },
          },
        }),
        prisma.videoProgress.findUnique({ where: { userId_videoId: { userId: user.id, videoId: v.id } } }),
      ])
    : [null, null];

  // Urutan video di kelas yang sama untuk sebelumnya/berikutnya (H.2.7).
  const sequence = (course?.sections ?? [])
    .flatMap((s) => s.lessons.map((l) => l.video))
    .filter((x): x is { slug: string; title: string; status: "TERBIT" | "DRAF" | "ARSIP" } => Boolean(x && x.status === "TERBIT"));
  const pos = sequence.findIndex((x) => x.slug === v.slug);

  const related = await prisma.video.findMany({
    where: { ...published, subject: v.subject, id: { not: v.id } },
    orderBy: { createdAt: "asc" },
    take: 4,
    select: { slug: true, title: true, durationSec: true },
  });

  const watched = Boolean(progress?.completedAt) || Boolean(full?.lessons.some((l) => l.progress.length > 0));
  return {
    id: v.id,
    slug: v.slug,
    title: v.title,
    description: v.description,
    subject: v.subject,
    category: v.category.name,
    difficulty: v.difficulty,
    durationSec: v.durationSec,
    access,
    player: full ? { provider: full.provider, url: full.url, durationSec: v.durationSec } : null,
    transcript: full?.transcript ?? null,
    note: full?.notes[0]?.content ?? "",
    bookmarked: Boolean(full?.bookmarks.length),
    lastPositionSec: progress?.lastPositionSec ?? 0,
    progressPercent: watched ? 100 : progress ? Math.min(99, Math.round((progress.watchedSec / Math.max(1, v.durationSec)) * 100)) : 0,
    watched,
    course: course ? { slug: course.slug, title: course.title, lessonSlug: v.lessons[0].slug } : null,
    prev: pos > 0 ? { slug: sequence[pos - 1].slug, title: sequence[pos - 1].title } : null,
    next: pos >= 0 && pos < sequence.length - 1 ? { slug: sequence[pos + 1].slug, title: sequence[pos + 1].title } : null,
    related,
    products: (course?.products ?? []).map((p) => p.product).sort((a, b) => (a.promoPrice ?? a.price) - (b.promoPrice ?? b.price)),
  };
}
