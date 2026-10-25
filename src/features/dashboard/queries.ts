// Data dashboard siswa (F). Semua query dibatasi ke userId pengguna yang sedang masuk (P.1.9).

import { prisma } from "@/lib/prisma";

const DAY = 86_400_000;
const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 1000) / 10 : 0);

export interface ActiveProgram {
  productName: string;
  productSlug: string;
  expiresAt: Date;
  active: boolean;
  courseCount: number;
  examCount: number;
}

export async function getPrograms(userId: string): Promise<ActiveProgram[]> {
  const rows = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { expiresAt: "desc" },
    select: {
      status: true,
      expiresAt: true,
      product: { select: { name: true, slug: true, _count: { select: { courses: true, exams: true } } } },
    },
  });
  const now = new Date();
  return rows.map((r) => ({
    productName: r.product.name,
    productSlug: r.product.slug,
    expiresAt: r.expiresAt,
    active: r.status === "AKTIF" && r.expiresAt > now,
    courseCount: r.product._count.courses,
    examCount: r.product._count.exams,
  }));
}

export interface CourseProgress {
  slug: string;
  title: string;
  total: number;
  completed: number;
  percent: number;
  lastAccessAt: Date | null;
  nextLesson: { slug: string; title: string } | null;
  enrolled: boolean;
}

/** Kelas yang dibeli atau pernah dibuka, dengan progres dan materi berikutnya (F.2.3, F.2.5, F.2.10). */
export async function getCourseProgress(userId: string): Promise<CourseProgress[]> {
  const now = new Date();
  const [enrolled, touched] = await Promise.all([
    prisma.productCourse.findMany({
      where: { product: { enrollments: { some: { userId, status: "AKTIF", expiresAt: { gt: now } } } } },
      select: { courseId: true },
    }),
    prisma.lessonProgress.findMany({ where: { userId }, select: { lesson: { select: { section: { select: { courseId: true } } } } } }),
  ]);
  const enrolledIds = new Set(enrolled.map((e) => e.courseId));
  const ids = [...new Set([...enrolledIds, ...touched.map((t) => t.lesson.section.courseId)])];
  if (ids.length === 0) return [];

  const courses = await prisma.course.findMany({
    where: { id: { in: ids }, status: "TERBIT", deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      sections: {
        orderBy: { order: "asc" },
        select: {
          isFree: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { slug: true, title: true, progress: { where: { userId }, select: { completedAt: true, updatedAt: true } } },
          },
        },
      },
    },
  });

  return courses
    .map((c) => {
      const lessons = c.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, open: s.isFree || enrolledIds.has(c.id) })));
      const completed = lessons.filter((l) => l.progress[0]?.completedAt).length;
      const last = lessons
        .map((l) => l.progress[0]?.updatedAt)
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      const next = lessons.find((l) => l.open && !l.progress[0]?.completedAt);
      return {
        slug: c.slug,
        title: c.title,
        total: lessons.length,
        completed,
        percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
        lastAccessAt: last ?? null,
        nextLesson: next ? { slug: next.slug, title: next.title } : null,
        enrolled: enrolledIds.has(c.id),
      };
    })
    .sort((a, b) => (b.lastAccessAt?.getTime() ?? 0) - (a.lastAccessAt?.getTime() ?? 0));
}

export interface ResultRow {
  attemptId: string;
  examTitle: string;
  examSlug: string;
  attemptNo: number;
  submittedAt: Date;
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  correct: number;
  wrong: number;
  empty: number;
  durationSec: number;
  sections: { title: string; score: number; maxScore: number; passed: boolean | null }[];
}

/** Riwayat hasil tryout (F.2.6, F.3.1, Riwayat Hasil). */
export async function getResults(userId: string): Promise<ResultRow[]> {
  const rows = await prisma.examAttempt.findMany({
    where: { userId, status: "SELESAI", result: { isNot: null } },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      attemptNo: true,
      submittedAt: true,
      exam: { select: { title: true, slug: true } },
      result: {
        select: {
          totalScore: true,
          maxScore: true,
          passed: true,
          correct: true,
          wrong: true,
          empty: true,
          durationSec: true,
          sections: {
            orderBy: { section: { order: "asc" } },
            select: { score: true, maxScore: true, passed: true, section: { select: { title: true } } },
          },
        },
      },
    },
  });
  return rows.map((r) => ({
    attemptId: r.id,
    examTitle: r.exam.title,
    examSlug: r.exam.slug,
    attemptNo: r.attemptNo,
    submittedAt: r.submittedAt!,
    score: r.result!.totalScore,
    maxScore: r.result!.maxScore,
    percent: pct(r.result!.totalScore, r.result!.maxScore),
    passed: r.result!.passed,
    correct: r.result!.correct,
    wrong: r.result!.wrong,
    empty: r.result!.empty,
    durationSec: r.result!.durationSec,
    sections: r.result!.sections.map((s) => ({ title: s.section.title, score: s.score, maxScore: s.maxScore, passed: s.passed })),
  }));
}

/** Waktu belajar total dan per minggu (F.2.8, F.3.3). Minggu dimulai Senin. */
export async function getStudyTime(userId: string, weeks = 6) {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const start = new Date(monday.getTime() - (weeks - 1) * 7 * DAY);

  const [total, rows] = await Promise.all([
    prisma.learningSession.aggregate({ where: { userId }, _sum: { seconds: true } }),
    prisma.learningSession.findMany({ where: { userId, date: { gte: start } }, select: { date: true, seconds: true } }),
  ]);
  const buckets = Array.from({ length: weeks }, (_, i) => ({ start: new Date(start.getTime() + i * 7 * DAY), seconds: 0 }));
  for (const r of rows) {
    const i = Math.floor((r.date.getTime() - start.getTime()) / (7 * DAY));
    if (buckets[i]) buckets[i].seconds += r.seconds;
  }
  return { totalSeconds: total._sum.seconds ?? 0, weekly: buckets, thisWeekSeconds: buckets.at(-1)?.seconds ?? 0 };
}

export interface TopicMastery {
  topic: string;
  subject: string;
  correct: number;
  total: number;
  mastery: number;
  avgTimeSec: number;
}

/** Penguasaan topik gabungan dari semua tryout (F.3.2, J.2.1–J.2.3). */
export async function getTopicMastery(userId: string): Promise<TopicMastery[]> {
  const rows = await prisma.topicAnalysis.findMany({
    where: { result: { attempt: { userId } } },
    select: { topic: true, correct: true, total: true, avgTimeSec: true },
  });
  const subjects = await prisma.question.findMany({
    where: { topic: { in: [...new Set(rows.map((r) => r.topic))] } },
    distinct: ["topic"],
    select: { topic: true, subject: true },
  });
  const subjectOf = new Map(subjects.map((s) => [s.topic, s.subject]));
  const agg = new Map<string, { correct: number; total: number; time: number }>();
  for (const r of rows) {
    const a = agg.get(r.topic) ?? { correct: 0, total: 0, time: 0 };
    a.correct += r.correct;
    a.total += r.total;
    a.time += r.avgTimeSec * r.total;
    agg.set(r.topic, a);
  }
  return [...agg]
    .map(([topic, a]) => ({
      topic,
      subject: subjectOf.get(topic) ?? "",
      correct: a.correct,
      total: a.total,
      mastery: Math.round((a.correct / a.total) * 100),
      avgTimeSec: Math.round(a.time / a.total),
    }))
    .sort((a, b) => a.mastery - b.mastery);
}

/** Nilai terbaikmu dibanding rata-rata nilai terbaik semua peserta per tryout (F.3.4, J.2.7). */
export async function getComparison(userId: string) {
  const rows = await prisma.examAttempt.findMany({
    where: { status: "SELESAI", result: { isNot: null }, exam: { attempts: { some: { userId, status: "SELESAI" } } } },
    select: { userId: true, exam: { select: { id: true, title: true } }, result: { select: { totalScore: true, maxScore: true } } },
  });
  const byExam = new Map<string, { title: string; best: Map<string, number> }>();
  for (const r of rows) {
    const e = byExam.get(r.exam.id) ?? { title: r.exam.title, best: new Map<string, number>() };
    const p = pct(r.result!.totalScore, r.result!.maxScore);
    e.best.set(r.userId, Math.max(e.best.get(r.userId) ?? 0, p));
    byExam.set(r.exam.id, e);
  }
  return [...byExam.values()].map((e) => {
    const all = [...e.best.values()];
    return {
      exam: e.title,
      mine: e.best.get(userId) ?? 0,
      average: Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10,
      participants: all.length,
    };
  });
}

/** Tryout yang bisa dikerjakan dari paket aktif (F.2.4, Tryout Saya). */
export async function getMyExams(userId: string) {
  const now = new Date();
  const exams = await prisma.exam.findMany({
    where: {
      status: "TERBIT",
      deletedAt: null,
      products: { some: { product: { enrollments: { some: { userId, status: "AKTIF", expiresAt: { gt: now } } } } } },
    },
    select: {
      slug: true,
      title: true,
      durationMin: true,
      opensAt: true,
      closesAt: true,
      maxAttempts: true,
      _count: { select: { questions: true } },
      attempts: { where: { userId }, select: { status: true, result: { select: { totalScore: true, maxScore: true } } } },
    },
  });
  return exams.map((e) => {
    const done = e.attempts.filter((a) => a.status === "SELESAI");
    const best = done.reduce((m, a) => Math.max(m, a.result ? pct(a.result.totalScore, a.result.maxScore) : 0), 0);
    return {
      slug: e.slug,
      title: e.title,
      durationMin: e.durationMin,
      questionCount: e._count.questions,
      opensAt: e.opensAt,
      closesAt: e.closesAt,
      attemptsUsed: e.attempts.length,
      maxAttempts: e.maxAttempts,
      status: e.attempts.some((a) => a.status === "BERLANGSUNG") ? "Sedang dikerjakan" : done.length ? "Selesai" : "Belum mulai",
      bestPercent: done.length ? best : null,
    };
  });
}

export type ActivityItem = { at: Date; text: string; href: string | null };

/** Aktivitas terakhir lintas fitur (F.2.9, G.4.9). */
export async function getActivity(userId: string, take = 8): Promise<ActivityItem[]> {
  const [lessons, attempts, orders, certs] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take,
      select: { completedAt: true, lesson: { select: { slug: true, title: true, section: { select: { course: { select: { slug: true, title: true } } } } } } },
    }),
    prisma.examAttempt.findMany({
      where: { userId, status: "SELESAI" },
      orderBy: { submittedAt: "desc" },
      take,
      select: { id: true, submittedAt: true, exam: { select: { title: true } } },
    }),
    prisma.order.findMany({
      where: { userId, status: "BERHASIL" },
      orderBy: { paidAt: "desc" },
      take,
      select: { paidAt: true, items: { select: { nameSnapshot: true } } },
    }),
    prisma.userCertificate.findMany({ where: { userId }, orderBy: { issuedAt: "desc" }, take, select: { issuedAt: true, number: true, certificate: { select: { title: true } } } }),
  ]);
  const items: ActivityItem[] = [
    ...lessons.map((l) => ({
      at: l.completedAt!,
      text: `Menyelesaikan “${l.lesson.title}” di ${l.lesson.section.course.title}`,
      href: `/kelas/${l.lesson.section.course.slug}/${l.lesson.slug}`,
    })),
    ...attempts.map((a) => ({ at: a.submittedAt!, text: `Mengumpulkan ${a.exam.title}`, href: `/tryout/hasil/${a.id}` })),
    ...orders.map((o) => ({ at: o.paidAt!, text: `Membeli ${o.items.map((i) => i.nameSnapshot).join(", ")}`, href: "/dashboard/transaksi" })),
    ...certs.map((c) => ({ at: c.issuedAt, text: `Menerima ${c.certificate.title}`, href: `/sertifikat/${c.number}` })),
  ];
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, take);
}

/** Rekomendasi belajar dari topik terlemah (F.2.10, J.2.8): kelas dengan mata pelajaran yang sama. */
export async function getRecommendations(userId: string, topics: TopicMastery[], courses: CourseProgress[]) {
  const weak = topics.filter((t) => t.mastery < 70).slice(0, 3);
  if (weak.length === 0) return [];
  const subjects = [...new Set(weak.map((t) => t.subject))];
  const matching = await prisma.course.findMany({
    where: { subject: { in: subjects }, status: "TERBIT", deletedAt: null },
    select: { slug: true, title: true, subject: true },
  });
  return weak.map((t) => {
    const course = matching.find((c) => c.subject === t.subject);
    const progress = course ? courses.find((c) => c.slug === course.slug) : undefined;
    return {
      topic: t.topic,
      mastery: t.mastery,
      course: course ? { slug: course.slug, title: course.title } : null,
      nextLesson: progress?.nextLesson ?? null,
    };
  });
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
}

export async function getOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      number: true,
      status: true,
      total: true,
      subtotal: true,
      discount: true,
      createdAt: true,
      expiresAt: true,
      paidAt: true,
      items: { select: { nameSnapshot: true, price: true, promoPrice: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1, select: { method: true } },
    },
  });
}

export async function getCertificates(userId: string) {
  return prisma.userCertificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    select: { number: true, issuedAt: true, certificate: { select: { title: true, course: { select: { slug: true } } } } },
  });
}

export async function getSaved(userId: string) {
  const [bookmarks, watched] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        lesson: { select: { slug: true, title: true, section: { select: { course: { select: { slug: true, title: true } } } } } },
        video: { select: { slug: true, title: true, subject: true } },
      },
    }),
    prisma.videoProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { updatedAt: true, completedAt: true, watchedSec: true, video: { select: { slug: true, title: true, subject: true, durationSec: true } } },
    }),
  ]);
  return { bookmarks, watched };
}

export async function getProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, passwordHash: true, profile: true, accounts: { select: { provider: true } } },
  });
}

/** Akurasi per tingkat kesulitan soal (J.2.4–J.2.5). Essay yang belum dinilai tidak dihitung. */
export async function getDifficultyBreakdown(userId: string) {
  const answers = await prisma.examAnswer.findMany({
    where: { attempt: { userId, status: "SELESAI" }, isCorrect: { not: null } },
    select: { isCorrect: true, timeSpentSec: true, question: { select: { difficulty: true } } },
  });
  const order = ["MUDAH", "SEDANG", "SULIT"] as const;
  return order.map((d) => {
    const rows = answers.filter((a) => a.question.difficulty === d);
    const correct = rows.filter((a) => a.isCorrect).length;
    return {
      difficulty: d,
      total: rows.length,
      correct,
      accuracy: rows.length ? Math.round((correct / rows.length) * 100) : null,
      avgTimeSec: rows.length ? Math.round(rows.reduce((n, a) => n + a.timeSpentSec, 0) / rows.length) : null,
    };
  });
}
