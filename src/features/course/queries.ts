// Pembacaan data kelas online (G). Struktur kelas di-cache (tag "katalog"); keadaan per
// pengguna dan konten materi dibaca per request setelah akses diperiksa.

import { cacheLife, cacheTag } from "next/cache";

import { getCourseEnrollment } from "@/lib/access";
import { resolveLessonAccess, type LessonAccess } from "@/lib/access-rules";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";

const publishedCourse = { status: "TERBIT", deletedAt: null } as const;

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: { name: string; shortName: string };
  level: "MUDAH" | "SEDANG" | "SULIT";
  sectionCount: number;
  freeSectionCount: number;
  lessonCount: number;
  videoCount: number;
  estimatedMinutes: number;
}

/** Daftar kelas publik (C.5.1). */
export async function listCourses(): Promise<CourseListItem[]> {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  const rows = await prisma.course.findMany({
    where: publishedCourse,
    orderBy: [{ category: { order: "asc" } }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      level: true,
      estimatedMinutes: true,
      category: { select: { name: true, shortName: true } },
      sections: { select: { isFree: true, lessons: { select: { videoId: true } } } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    category: c.category,
    level: c.level,
    estimatedMinutes: c.estimatedMinutes,
    sectionCount: c.sections.length,
    freeSectionCount: c.sections.filter((s) => s.isFree).length,
    lessonCount: c.sections.reduce((n, s) => n + s.lessons.length, 0),
    videoCount: c.sections.reduce((n, s) => n + s.lessons.filter((l) => l.videoId).length, 0),
  }));
}

export async function listCourseSlugs() {
  return (await listCourses()).map((c) => c.slug);
}

export interface OutlineLesson {
  id: string;
  slug: string;
  title: string;
  type: "VIDEO" | "PDF" | "TEKS" | "KUIS" | "TUGAS";
  durationSec: number | null;
}

export interface CourseOutline {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  subject: string;
  level: "MUDAH" | "SEDANG" | "SULIT";
  sequentialLock: boolean;
  estimatedMinutes: number;
  category: { name: string; slug: string };
  sections: { id: string; title: string; isFree: boolean; lessons: OutlineLesson[] }[];
  /** Paket yang mencakup kelas ini, untuk ajakan berlangganan (G.4.12). */
  products: { slug: string; name: string; price: number; promoPrice: number | null; activeDays: number }[];
}

/** Struktur kelas tanpa konten berbayar (aman untuk tamu). */
export async function getCourseOutline(slug: string): Promise<CourseOutline | null> {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  const c = await prisma.course.findFirst({
    where: { slug, ...publishedCourse },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      subject: true,
      level: true,
      sequentialLock: true,
      estimatedMinutes: true,
      category: { select: { name: true, slug: true } },
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          isFree: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, slug: true, title: true, type: true, durationSec: true },
          },
        },
      },
      products: {
        where: { product: { status: "TERBIT", deletedAt: null } },
        select: { product: { select: { slug: true, name: true, price: true, promoPrice: true, activeDays: true } } },
      },
    },
  });
  if (!c) return null;
  return {
    ...c,
    products: c.products
      .map((p) => p.product)
      .sort((a, b) => (a.promoPrice ?? a.price) - (b.promoPrice ?? b.price)),
  };
}

export interface LessonState extends OutlineLesson {
  sectionId: string;
  sectionTitle: string;
  sectionIsFree: boolean;
  access: LessonAccess;
  completed: boolean;
  lastPositionSec: number;
}

export interface LearnerState {
  lessons: LessonState[];
  completedCount: number;
  totalCount: number;
  percent: number;
  studySeconds: number;
  enrollment: { expiresAt: Date; productName: string } | null;
  lastLessonSlug: string | null;
  recent: { title: string; slug: string; completedAt: Date }[];
  certificateNumber: string | null;
}

/**
 * Keadaan kelas untuk satu pengguna (atau tamu): akses tiap materi, progres, waktu belajar,
 * dan riwayat (G.1, G.3, G.4.1, G.4.3, G.4.9).
 */
export async function getLearnerState(
  outline: CourseOutline,
  user: { id: string; role: "ADMIN" | "USER" } | null,
): Promise<LearnerState> {
  const flat = outline.sections.flatMap((s) =>
    s.lessons.map((l) => ({ ...l, sectionId: s.id, sectionTitle: s.title, sectionIsFree: s.isFree })),
  );

  const [enrollment, progress, study, cert] = user
    ? await Promise.all([
        getCourseEnrollment(user.id, outline.id),
        prisma.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: flat.map((l) => l.id) } },
          select: { lessonId: true, completedAt: true, lastPositionSec: true, updatedAt: true },
        }),
        prisma.learningSession.aggregate({ where: { userId: user.id, courseId: outline.id }, _sum: { seconds: true } }),
        prisma.userCertificate.findFirst({
          where: { userId: user.id, certificate: { courseId: outline.id } },
          select: { number: true },
        }),
      ])
    : [null, [], null, null];

  const byLesson = new Map(progress.map((p) => [p.lessonId, p]));
  let previousIncomplete = false;
  const lessons: LessonState[] = flat.map((l) => {
    const p = byLesson.get(l.id);
    const access = resolveLessonAccess({
      user,
      sectionIsFree: l.sectionIsFree,
      enrolled: Boolean(enrollment),
      previousIncomplete: outline.sequentialLock && previousIncomplete,
    });
    const completed = Boolean(p?.completedAt);
    if (!completed) previousIncomplete = true;
    return { ...l, access, completed, lastPositionSec: p?.lastPositionSec ?? 0 };
  });

  const completedCount = lessons.filter((l) => l.completed).length;
  const last = [...progress].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  const recent = progress
    .filter((p) => p.completedAt)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
    .slice(0, 3)
    .map((p) => {
      const l = flat.find((x) => x.id === p.lessonId)!;
      return { title: l.title, slug: l.slug, completedAt: p.completedAt! };
    });

  return {
    lessons,
    completedCount,
    totalCount: lessons.length,
    percent: lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0,
    studySeconds: study?._sum.seconds ?? 0,
    enrollment: enrollment ? { expiresAt: enrollment.expiresAt, productName: enrollment.product.name } : null,
    lastLessonSlug: last ? (flat.find((l) => l.id === last.lessonId)?.slug ?? null) : null,
    recent,
    certificateNumber: cert?.number ?? null,
  };
}

export interface LessonContent {
  id: string;
  title: string;
  summary: string | null;
  html: string | null;
  type: OutlineLesson["type"];
  video: { provider: "YOUTUBE" | "VIMEO" | "EKSTERNAL"; url: string; durationSec: number } | null;
  materials: { id: string; title: string; format: string; bytes: number }[];
  note: string;
  bookmarked: boolean;
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    questions: { id: string; type: string; body: string; options: { id: string; label: string; body: string }[] }[];
    lastAttempt: { score: number; passed: boolean; submittedAt: Date } | null;
  } | null;
  discussions: {
    id: string;
    body: string;
    createdAt: Date;
    author: { name: string; isAdmin: boolean; isMe: boolean };
    replies: { id: string; body: string; createdAt: Date; author: { name: string; isAdmin: boolean; isMe: boolean } }[];
  }[];
}

/**
 * Konten satu materi. Hanya dipanggil setelah akses "terbuka"; URL video, isi, dan daftar
 * lampiran tidak pernah dibaca untuk materi terkunci (C.5.5).
 */
export async function getLessonContent(lessonId: string, userId: string): Promise<LessonContent | null> {
  const l = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
      type: true,
      video: { select: { provider: true, url: true, durationSec: true } },
      materials: { select: { id: true, title: true, media: { select: { format: true, bytes: true } } } },
      notes: { where: { userId }, select: { content: true } },
      bookmarks: { where: { userId }, select: { id: true } },
      quiz: {
        select: {
          id: true,
          title: true,
          passingScore: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              question: {
                select: {
                  id: true,
                  type: true,
                  body: true,
                  // Kunci jawaban (isCorrect) sengaja tidak dipilih.
                  options: { orderBy: { order: "asc" }, select: { id: true, label: true, body: true } },
                },
              },
            },
          },
          attempts: { where: { userId }, orderBy: { submittedAt: "desc" }, take: 1, select: { score: true, passed: true, submittedAt: true } },
        },
      },
      discussions: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          body: true,
          createdAt: true,
          user: { select: { id: true, name: true, role: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            select: { id: true, body: true, createdAt: true, user: { select: { id: true, name: true, role: true } } },
          },
        },
      },
    },
  });
  if (!l) return null;

  const author = (u: { id: string; name: string; role: string }) => ({
    name: u.role === "ADMIN" ? "Tim Taman Pelajar" : u.name,
    isAdmin: u.role === "ADMIN",
    isMe: u.id === userId,
  });

  return {
    id: l.id,
    title: l.title,
    summary: l.summary,
    html: l.content ? sanitizeRichText(l.content) : null,
    type: l.type,
    video: l.video,
    materials: l.materials.map((m) => ({ id: m.id, title: m.title, format: m.media.format, bytes: m.media.bytes })),
    note: l.notes[0]?.content ?? "",
    bookmarked: l.bookmarks.length > 0,
    quiz: l.quiz
      ? {
          id: l.quiz.id,
          title: l.quiz.title,
          passingScore: l.quiz.passingScore,
          questions: l.quiz.questions.map(({ question }) => question),
          lastAttempt: l.quiz.attempts[0] ?? null,
        }
      : null,
    discussions: l.discussions.map((d) => ({
      id: d.id,
      body: d.body,
      createdAt: d.createdAt,
      author: author(d.user),
      replies: d.replies.map((r) => ({ id: r.id, body: r.body, createdAt: r.createdAt, author: author(r.user) })),
    })),
  };
}

/** Siswa sudah pernah mengirim testimoni untuk kelas ini (revisi RMED)? */
export async function hasCourseTestimonial(userId: string, courseId: string) {
  return Boolean(await prisma.testimonial.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { id: true } }));
}
