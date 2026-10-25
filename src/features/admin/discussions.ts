import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

// Diskusi materi untuk dijawab admin (L.2.8). "Belum dijawab" = belum ada balasan admin.

const unanswered = { replies: { none: { user: { role: "ADMIN" } } } } satisfies Prisma.DiscussionWhereInput;

export async function countUnansweredDiscussions() {
  return prisma.discussion.count({ where: unanswered });
}

export async function listDiscussions(filter: { status?: "belum" | "sudah"; q?: string; page: number }) {
  await adminOnly();
  const PAGE = 20;
  const where: Prisma.DiscussionWhereInput = {
    ...(filter.status === "belum" && unanswered),
    ...(filter.status === "sudah" && { replies: { some: { user: { role: "ADMIN" } } } }),
    ...(filter.q && { OR: [{ body: { contains: filter.q } }, { user: { name: { contains: filter.q } } }] }),
  };
  const [total, rows] = await Promise.all([
    prisma.discussion.count({ where }),
    prisma.discussion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * PAGE,
      take: PAGE,
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        lesson: { select: { title: true, slug: true, section: { select: { course: { select: { title: true, slug: true } } } } } },
        replies: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true, user: { select: { name: true, role: true } } } },
      },
    }),
  ]);
  return { rows, total, page: filter.page, pageCount: Math.max(1, Math.ceil(total / PAGE)) };
}
