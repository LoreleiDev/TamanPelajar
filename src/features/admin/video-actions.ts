"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "./guard";
import { videoSchema } from "./video-schema";

const refresh = (id?: string) => {
  revalidatePath("/admin/video");
  if (id) revalidatePath(`/admin/video/${id}`);
  updateTag("katalog");
};

/** Buat atau ubah video pustaka (L.2.4). Durasi materi kelas yang memakainya ikut diperbarui. */
export async function simpanVideo(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = videoSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, duration: _d, ...data } = parsed.data;
    const clash = await prisma.video.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash && clash.id !== id) return fail("Slug sudah dipakai video lain.", { slug: "Slug ini sudah dipakai" });
    const row = { ...data, transcript: data.transcript || null };
    if (id) {
      const before = await prisma.video.findUnique({ where: { id }, select: { title: true, url: true, durationSec: true, status: true } });
      if (!before) return fail("Video tidak ditemukan.");
      await prisma.$transaction([
        prisma.video.update({ where: { id }, data: row }),
        prisma.lesson.updateMany({ where: { videoId: id }, data: { durationSec: data.durationSec } }),
      ]);
      await audit(prisma, admin, "video.ubah", "Video", id, { before, after: { title: data.title, url: data.url, durationSec: data.durationSec, status: data.status } });
      refresh(id);
      return ok({ id });
    }
    const created = await prisma.video.create({ data: row, select: { id: true } });
    await audit(prisma, admin, "video.buat", "Video", created.id, { after: { title: data.title, url: data.url } });
    refresh();
    return ok(created);
  });
}

/** Hapus video yang belum dipakai materi kelas; yang sudah dipakai cukup diarsipkan. */
export async function hapusVideo(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const used = await prisma.lesson.count({ where: { videoId: parsed.data.id } });
    if (used > 0) return fail(`Video dipakai ${used} materi kelas. Ganti video di materi itu dulu, atau arsipkan video ini.`);
    const before = await prisma.video.delete({ where: { id: parsed.data.id }, select: { title: true, url: true } });
    await audit(prisma, admin, "video.hapus", "Video", parsed.data.id, { before });
    refresh();
    return ok(null);
  });
}
