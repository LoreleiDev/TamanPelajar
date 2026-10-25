import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

/** Sertifikat per kelas dan sertifikat yang sudah terbit (M.1 Sertifikat, G.4.6). */
export async function listCertificates() {
  await adminOnly();
  const rows = await prisma.certificate.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      course: { select: { id: true, title: true, deletedAt: true } },
      issued: {
        orderBy: { issuedAt: "desc" },
        take: 50,
        select: { id: true, number: true, issuedAt: true, user: { select: { id: true, name: true } } },
      },
      _count: { select: { issued: true } },
    },
  });
  const coursesWithout = await prisma.course.findMany({ where: { deletedAt: null, certificate: null }, select: { id: true, title: true }, orderBy: { title: "asc" } });
  return { certificates: rows, coursesWithout };
}
