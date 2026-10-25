"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { adminAction, audit } from "@/features/admin/guard";
import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { articleSchema } from "./schemas";

const refresh = (id?: string) => {
  revalidatePath("/admin/informasi");
  if (id) revalidatePath(`/admin/informasi/${id}`);
  updateTag("katalog");
};

/** Buat atau ubah artikel (C.2.8). Tanggal terbit diisi saat pertama kali diterbitkan. */
export async function simpanArtikel(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = articleSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, ...data } = parsed.data;
    const clash = await prisma.article.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash && clash.id !== id) return fail("Slug sudah dipakai artikel lain.", { slug: "Slug ini sudah dipakai" });
    if (id) {
      const before = await prisma.article.findUnique({ where: { id }, select: { status: true, publishedAt: true, title: true } });
      if (!before) return fail("Artikel tidak ditemukan.");
      const publishedAt = data.status === "TERBIT" ? (before.publishedAt ?? new Date()) : before.publishedAt;
      await prisma.article.update({ where: { id }, data: { ...data, publishedAt } });
      await audit(prisma, admin, "artikel.ubah", "Article", id, { before, after: { title: data.title, status: data.status } });
      refresh(id);
      return ok({ id });
    }
    const created = await prisma.article.create({
      data: { ...data, authorId: admin.id, publishedAt: data.status === "TERBIT" ? new Date() : null },
      select: { id: true },
    });
    await audit(prisma, admin, "artikel.buat", "Article", created.id, { after: { title: data.title, status: data.status } });
    refresh();
    return ok(created);
  });
}

export async function hapusArtikel(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const before = await prisma.article.delete({ where: { id: parsed.data.id }, select: { title: true, slug: true } });
    await audit(prisma, admin, "artikel.hapus", "Article", parsed.data.id, { before });
    refresh();
    return ok(null);
  });
}
