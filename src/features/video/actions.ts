"use server";

import type { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { AuthorizationError, requireRole } from "@/lib/rbac";
import { canAccessVideo } from "@/lib/video-access";

import { videoIdSchema, videoNoteSchema, videoProgressSchema } from "./schemas";

async function guard<S extends z.ZodType<{ videoId: string }>>(schema: S, input: unknown) {
  let user;
  try {
    user = await requireRole();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) } as const;
    throw e;
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: invalidInput(parsed.error) } as const;
  const data = parsed.data as z.infer<S>;
  if ((await canAccessVideo(user, data.videoId)) !== "terbuka") return { error: fail("Video ini belum terbuka untuk akunmu.") } as const;
  return { user, data } as const;
}

/** Progres tontonan (H.2.8); selesai otomatis pada 90% durasi. */
export async function saveVideoProgress(
  input: z.input<typeof videoProgressSchema>,
): Promise<ActionResult<{ completed: boolean; courseDone: boolean }>> {
  const g = await guard(videoProgressSchema, input);
  if ("error" in g) return g.error!;
  const { user, data } = g;
  const video = await prisma.video.findUniqueOrThrow({ where: { id: data.videoId }, select: { durationSec: true } });

  const row = await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId: user.id, videoId: data.videoId } },
    create: { userId: user.id, videoId: data.videoId, lastPositionSec: data.positionSec, watchedSec: data.watchedDeltaSec },
    update: { lastPositionSec: data.positionSec, watchedSec: { increment: data.watchedDeltaSec } },
  });
  const reached = row.watchedSec >= video.durationSec * 0.9 || data.positionSec >= video.durationSec * 0.97;
  if (reached && !row.completedAt) {
    await prisma.videoProgress.update({ where: { id: row.id }, data: { completedAt: new Date() } });
  }

  if (data.watchedDeltaSec > 0) {
    const d = new Date();
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const existing = await prisma.learningSession.findFirst({ where: { userId: user.id, videoId: data.videoId, date }, select: { id: true } });
    if (existing) await prisma.learningSession.update({ where: { id: existing.id }, data: { seconds: { increment: data.watchedDeltaSec } } });
    else await prisma.learningSession.create({ data: { userId: user.id, videoId: data.videoId, date, seconds: data.watchedDeltaSec } });
  }
  return ok({ completed: Boolean(row.completedAt) || reached, courseDone: false });
}

/** Catatan siswa di halaman video (H.2.5). */
export async function saveVideoNote(input: z.input<typeof videoNoteSchema>): Promise<ActionResult<null>> {
  const g = await guard(videoNoteSchema, input);
  if ("error" in g) return g.error!;
  const { user, data } = g;
  if (!data.content.trim()) {
    await prisma.lessonNote.deleteMany({ where: { userId: user.id, videoId: data.videoId } });
  } else {
    await prisma.lessonNote.upsert({
      where: { userId_videoId: { userId: user.id, videoId: data.videoId } },
      create: { userId: user.id, videoId: data.videoId, content: data.content },
      update: { content: data.content },
    });
  }
  return ok(null);
}

/** Tombol simpan video (H.2.6). */
export async function toggleVideoBookmark(input: z.input<typeof videoIdSchema>): Promise<ActionResult<{ bookmarked: boolean }>> {
  const g = await guard(videoIdSchema, input);
  if ("error" in g) return g.error!;
  const where = { userId_videoId: { userId: g.user.id, videoId: g.data.videoId } };
  const existing = await prisma.bookmark.findUnique({ where });
  if (existing) await prisma.bookmark.delete({ where });
  else await prisma.bookmark.create({ data: { userId: g.user.id, videoId: g.data.videoId } });
  return ok({ bookmarked: !existing });
}
