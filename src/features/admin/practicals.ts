import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

const select = {
  id: true,
  driveUrl: true,
  note: true,
  status: true,
  reviewNote: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: { select: { name: true } },
  participant: {
    select: {
      id: true,
      finalScore: true,
      isRetake: true,
      user: { select: { id: true, name: true, email: true } },
      batch: { select: { name: true, endsAt: true, course: { select: { id: true, title: true, certificate: { select: { minScore: true } } } } } },
      _count: { select: { submissions: { where: { status: "REVISI" } } } },
    },
  },
} as const;

/** Antrean tugas praktik sertifikat (revisi RMED): menunggu penilaian dan yang baru dinilai. */
export async function getPracticalQueue() {
  await adminOnly();
  const [pending, reviewed] = await Promise.all([
    prisma.practicalSubmission.findMany({ where: { status: "MENUNGGU" }, orderBy: { createdAt: "asc" }, select }),
    prisma.practicalSubmission.findMany({ where: { status: { not: "MENUNGGU" } }, orderBy: { reviewedAt: "desc" }, take: 20, select }),
  ]);
  return { pending, reviewed };
}

export const countPendingPracticals = () => prisma.practicalSubmission.count({ where: { status: "MENUNGGU" } });
