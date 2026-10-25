import { getRetakeAccess } from "@/features/certificate/service";
import type { LessonAccess } from "@/lib/access-rules";
import { prisma } from "@/lib/prisma";

type User = { id: string; role: "ADMIN" | "USER" } | null;

/**
 * Akses video di pustaka (H, C.5.2): tamu harus masuk; video dari bab gratis atau video
 * lepas terbuka untuk user; video dari bab berbayar butuh langganan paket yang mencakup
 * kelasnya atau videonya.
 */
export async function canAccessVideo(user: User, videoId: string): Promise<LessonAccess> {
  if (!user) return "perlu-masuk";
  if (user.role === "ADMIN") return "terbuka";
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      status: true,
      lessons: { select: { section: { select: { isFree: true, courseId: true } } } },
      _count: { select: { products: true } },
    },
  });
  if (!video || video.status !== "TERBIT") return "perlu-langganan";
  if (video.lessons.some((l) => l.section.isFree)) return "terbuka";
  if (video.lessons.length === 0 && video._count.products === 0) return "terbuka";

  const courseIds = video.lessons.map((l) => l.section.courseId);
  const enrolled = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      status: "AKTIF",
      expiresAt: { gt: new Date() },
      product: {
        OR: [{ courses: { some: { courseId: { in: courseIds } } } }, { videos: { some: { videoId } } }],
      },
    },
    select: { id: true },
  });
  if (enrolled) return "terbuka";
  // Ulang gratis batch berikutnya juga membuka video kelas itu.
  for (const courseId of new Set(courseIds)) {
    if (await getRetakeAccess(user.id, courseId)) return "terbuka";
  }
  return "perlu-langganan";
}
