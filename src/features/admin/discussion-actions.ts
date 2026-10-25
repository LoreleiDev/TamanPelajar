"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "./guard";

const replySchema = z.object({
  discussionId: z.string().min(1),
  body: z.string().trim().min(3, "Balasan minimal 3 karakter").max(3000, "Balasan maksimal 3.000 karakter"),
});

/** Jawab diskusi siswa (L.2.8); penanya mendapat notifikasi berisi tautan ke materinya. */
export async function balasDiskusi(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = replySchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const d = await prisma.discussion.findUnique({
      where: { id: parsed.data.discussionId },
      select: { userId: true, lesson: { select: { title: true, slug: true, section: { select: { course: { select: { slug: true } } } } } } },
    });
    if (!d) return fail("Diskusi tidak ditemukan. Mungkin sudah dihapus.");
    await prisma.discussionReply.create({ data: { discussionId: parsed.data.discussionId, userId: admin.id, body: parsed.data.body } });
    if (d.userId !== admin.id) {
      await prisma.notification.create({
        data: {
          userId: d.userId,
          type: "KELAS",
          title: "Pertanyaanmu dijawab",
          body: d.lesson ? `Admin menjawab diskusi di materi ${d.lesson.title}.` : "Admin menjawab diskusimu.",
          href: d.lesson ? `/kelas/${d.lesson.section.course.slug}/${d.lesson.slug}#diskusi` : null,
        },
      });
    }
    await audit(prisma, admin, "diskusi.balas", "Discussion", parsed.data.discussionId, { after: { body: parsed.data.body } });
    revalidatePath("/admin/diskusi");
    return ok(null);
  });
}

/** Hapus diskusi atau balasan yang melanggar aturan (moderasi). */
export async function hapusDiskusi(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = z.object({ id: z.string().min(1), kind: z.enum(["diskusi", "balasan"]) }).safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, kind } = parsed.data;
    const before =
      kind === "diskusi"
        ? await prisma.discussion.delete({ where: { id }, select: { body: true, userId: true } })
        : await prisma.discussionReply.delete({ where: { id }, select: { body: true, userId: true } });
    await audit(prisma, admin, kind === "diskusi" ? "diskusi.hapus" : "diskusi.hapus-balasan", "Discussion", id, { before });
    revalidatePath("/admin/diskusi");
    return ok(null);
  });
}
