"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "./guard";
import { programSchema } from "./program-schema";

const refresh = () => {
  revalidatePath("/admin/program");
  updateTag("katalog");
};

/** Buat atau ubah program (M.1 Program). */
export async function simpanProgram(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = programSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, ...data } = parsed.data;
    const clash = await prisma.courseCategory.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash && clash.id !== id) return fail("Slug sudah dipakai program lain.", { slug: "Slug ini sudah dipakai" });
    if (id) {
      const before = await prisma.courseCategory.findUnique({ where: { id } });
      if (!before) return fail("Program tidak ditemukan.");
      await prisma.courseCategory.update({ where: { id }, data });
      await audit(prisma, admin, "program.ubah", "CourseCategory", id, { before, after: data });
      refresh();
      return ok({ id });
    }
    const created = await prisma.courseCategory.create({ data, select: { id: true } });
    await audit(prisma, admin, "program.buat", "CourseCategory", created.id, { after: data });
    refresh();
    return ok(created);
  });
}

/** Hapus program yang belum dipakai kelas, video, tryout, paket, atau soal. */
export async function hapusProgram(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const c = await prisma.courseCategory.findUnique({
      where: { id: parsed.data.id },
      include: { _count: { select: { courses: true, videos: true, exams: true, products: true, questions: true } } },
    });
    if (!c) return fail("Program tidak ditemukan.");
    if (Object.values(c._count).some((n) => n > 0)) return fail("Program ini masih dipakai kelas, video, tryout, paket, atau soal. Pindahkan dulu isinya.");
    await prisma.courseCategory.delete({ where: { id: c.id } });
    await audit(prisma, admin, "program.hapus", "CourseCategory", c.id, { before: { name: c.name, slug: c.slug } });
    refresh();
    return ok(null);
  });
}
