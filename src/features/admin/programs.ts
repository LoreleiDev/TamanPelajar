import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

export async function listPrograms() {
  await adminOnly();
  const rows = await prisma.courseCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { courses: true, videos: true, exams: true, products: true, questions: true } } },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, counts: _count, used: Object.values(_count).reduce((a, b) => a + b, 0) }));
}
