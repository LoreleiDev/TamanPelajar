import { prisma } from "@/lib/prisma";

import { syncCertificateTrack, type CertificateTrack } from "./service";

/**
 * Jalur sertifikat yang sedang berjalan untuk dashboard siswa: kelas bersertifikat dan
 * berbatch yang bisa diakses lewat paket, pernah diikuti di sebuah batch, atau sudah lulus.
 */
export async function listCertificateTracks(userId: string): Promise<(CertificateTrack & { courseTitle: string; courseSlug: string })[]> {
  const now = new Date();
  const courses = await prisma.course.findMany({
    where: {
      deletedAt: null,
      certificate: { isNot: null },
      batches: { some: {} },
      OR: [
        { products: { some: { product: { enrollments: { some: { userId, status: "AKTIF", expiresAt: { gt: now } } } } } } },
        { batches: { some: { participants: { some: { userId } } } } },
      ],
    },
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true },
  });
  const tracks = await Promise.all(courses.map(async (c) => ({ c, track: await syncCertificateTrack(userId, c.id, now) })));
  return tracks.flatMap(({ c, track }) => (track ? [{ ...track, courseTitle: c.title, courseSlug: c.slug }] : []));
}
