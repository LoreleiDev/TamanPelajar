"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "./guard";
import { subjectSchema } from "./subject-schema";

const refresh = () => {
  revalidatePath("/admin/mata-pelajaran");
  updateTag("katalog");
};

/** Buat atau ubah mata pelajaran. Ganti nama ikut memperbarui kelas, video, dan soal yang memakainya. */
export async function simpanMataPelajaran(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = subjectSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, ...data } = parsed.data;
    const clash = await prisma.subject.findUnique({ where: { name: data.name }, select: { id: true } });
    if (clash && clash.id !== id) return fail("Mata pelajaran ini sudah ada.", { name: "Nama ini sudah dipakai" });
    if (id) {
      const before = await prisma.subject.findUnique({ where: { id } });
      if (!before) return fail("Mata pelajaran tidak ditemukan.");
      await prisma.$transaction([
        prisma.subject.update({ where: { id }, data }),
        ...(before.name !== data.name
          ? [
              prisma.course.updateMany({ where: { subject: before.name }, data: { subject: data.name } }),
              prisma.video.updateMany({ where: { subject: before.name }, data: { subject: data.name } }),
              prisma.question.updateMany({ where: { subject: before.name }, data: { subject: data.name } }),
            ]
          : []),
      ]);
      await audit(prisma, admin, "mapel.ubah", "Subject", id, { before: { name: before.name, order: before.order }, after: data });
      refresh();
      return ok({ id });
    }
    const created = await prisma.subject.create({ data, select: { id: true } });
    await audit(prisma, admin, "mapel.buat", "Subject", created.id, { after: data });
    refresh();
    return ok(created);
  });
}

/** Hapus mata pelajaran yang belum dipakai kelas, video, atau soal. */
export async function hapusMataPelajaran(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const s = await prisma.subject.findUnique({ where: { id: parsed.data.id } });
    if (!s) return fail("Mata pelajaran tidak ditemukan.");
    const [courses, videos, questions] = await Promise.all([
      prisma.course.count({ where: { subject: s.name, deletedAt: null } }),
      prisma.video.count({ where: { subject: s.name } }),
      prisma.question.count({ where: { subject: s.name, deletedAt: null } }),
    ]);
    if (courses + videos + questions > 0) return fail("Mata pelajaran ini masih dipakai kelas, video, atau soal. Ganti dulu mata pelajarannya di sana.");
    await prisma.subject.delete({ where: { id: s.id } });
    await audit(prisma, admin, "mapel.hapus", "Subject", s.id, { before: { name: s.name } });
    refresh();
    return ok(null);
  });
}
