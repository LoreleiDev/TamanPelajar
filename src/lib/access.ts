import { getRetakeAccess } from "@/features/certificate/service";
import { resolveLessonAccess, type AccessInput, type LessonAccess } from "@/lib/access-rules";
import { prisma } from "@/lib/prisma";

export { resolveLessonAccess, type AccessInput, type LessonAccess };

// Akses materi kelas (C.5, G.4.3, G.4.10–G.4.12, K.5). Satu sumber aturan untuk query
// halaman, URL video, dan signed URL PDF. Materi terkunci tidak pernah dikirim ke client.

/**
 * Langganan aktif dari paket mana pun yang mencakup kelas ini. Siswa yang gagal di batch
 * sebelumnya mendapat akses ulang gratis selama batch berikutnya berjalan (revisi RMED).
 */
export async function getCourseEnrollment(userId: string, courseId: string) {
  const paid = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: "AKTIF",
      expiresAt: { gt: new Date() },
      product: { courses: { some: { courseId } } },
    },
    orderBy: { expiresAt: "desc" },
    select: { expiresAt: true, product: { select: { name: true, slug: true } } },
  });
  if (paid) return paid;
  const retake = await getRetakeAccess(userId, courseId);
  return retake ? { expiresAt: retake.endsAt, product: { name: `Ulang gratis ${retake.batchName}`, slug: "" } } : null;
}

/**
 * Cek akses satu materi dari database. Dipakai route handler file dan action yang
 * menerima lessonId dari client.
 */
export async function canAccessLesson(
  user: AccessInput["user"],
  lessonId: string,
): Promise<{ access: LessonAccess; lesson: { id: string; courseId: string } | null }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      order: true,
      section: {
        select: {
          isFree: true,
          order: true,
          course: { select: { id: true, sequentialLock: true, status: true, deletedAt: true } },
        },
      },
    },
  });
  const course = lesson?.section.course;
  if (!lesson || !course || course.deletedAt || (course.status !== "TERBIT" && user?.role !== "ADMIN")) {
    return { access: "perlu-langganan", lesson: null };
  }

  const enrolled = user ? Boolean(await getCourseEnrollment(user.id, course.id)) : false;
  let previousIncomplete = false;
  if (user && course.sequentialLock) {
    const earlier = await prisma.lesson.findMany({
      where: {
        section: { courseId: course.id },
        OR: [
          { section: { order: { lt: lesson.section.order } } },
          { section: { order: lesson.section.order }, order: { lt: lesson.order } },
        ],
      },
      select: { progress: { where: { userId: user.id, completedAt: { not: null } }, select: { id: true } } },
    });
    previousIncomplete = earlier.some((l) => l.progress.length === 0);
  }

  return {
    access: resolveLessonAccess({ user, sectionIsFree: lesson.section.isFree, enrolled, previousIncomplete }),
    lesson: { id: lesson.id, courseId: course.id },
  };
}
