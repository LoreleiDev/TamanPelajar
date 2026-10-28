"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import type { BulkDeleteReport } from "@/components/admin/bulk-selection";
import { invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "./guard";

// Hapus massal (revisi RMED). Aturannya sama dengan hapus satuan di setiap menu; data yang
// tidak boleh dihapus dilewati dan dilaporkan beserta alasannya.

const idsSchema = z.object({ ids: z.array(z.string().min(1)).min(1, "Pilih minimal satu data").max(200, "Maksimal 200 data sekaligus") });

const done = (path: string) => {
  revalidatePath(path);
  updateTag("katalog");
};

/** Program yang masih dipakai kelas, video, tryout, paket, atau soal dilewati. */
export async function hapusProgramMassal(input: unknown): Promise<ActionResult<BulkDeleteReport>> {
  return adminAction(async (admin) => {
    const parsed = idsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const rows = await prisma.courseCategory.findMany({
      where: { id: { in: parsed.data.ids } },
      include: { _count: { select: { courses: true, videos: true, exams: true, products: true, questions: true } } },
    });
    const report: BulkDeleteReport = { deleted: 0, skipped: [] };
    for (const c of rows) {
      if (Object.values(c._count).some((n) => n > 0)) {
        report.skipped.push({ name: c.name, reason: "masih dipakai kelas, video, tryout, paket, atau soal" });
        continue;
      }
      await prisma.courseCategory.delete({ where: { id: c.id } });
      await audit(prisma, admin, "program.hapus", "CourseCategory", c.id, { before: { name: c.name, slug: c.slug } });
      report.deleted++;
    }
    done("/admin/program");
    return ok(report);
  });
}

/** Kelas dihapus lunak (arsip); progres dan sertifikat siswa tetap tersimpan. */
export async function hapusKelasMassal(input: unknown): Promise<ActionResult<BulkDeleteReport>> {
  return adminAction(async (admin) => {
    const parsed = idsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const rows = await prisma.course.findMany({ where: { id: { in: parsed.data.ids }, deletedAt: null }, select: { id: true, title: true } });
    const now = new Date();
    await prisma.course.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { deletedAt: now, status: "ARSIP" } });
    for (const r of rows) await audit(prisma, admin, "kelas.hapus", "Course", r.id, { before: { title: r.title } });
    done("/admin/kelas");
    return ok({ deleted: rows.length, skipped: [] });
  });
}

/** Video yang masih dipakai materi kelas dilewati. */
export async function hapusVideoMassal(input: unknown): Promise<ActionResult<BulkDeleteReport>> {
  return adminAction(async (admin) => {
    const parsed = idsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const rows = await prisma.video.findMany({
      where: { id: { in: parsed.data.ids } },
      select: { id: true, title: true, url: true, _count: { select: { lessons: true } } },
    });
    const report: BulkDeleteReport = { deleted: 0, skipped: [] };
    for (const v of rows) {
      if (v._count.lessons > 0) {
        report.skipped.push({ name: v.title, reason: `dipakai ${v._count.lessons} materi kelas` });
        continue;
      }
      await prisma.video.delete({ where: { id: v.id } });
      await audit(prisma, admin, "video.hapus", "Video", v.id, { before: { title: v.title, url: v.url } });
      report.deleted++;
    }
    done("/admin/video");
    return ok(report);
  });
}

/** Paket dihapus lunak; pesanan dan langganan lama tetap tersimpan, keranjang dibersihkan. */
export async function hapusProdukMassal(input: unknown): Promise<ActionResult<BulkDeleteReport>> {
  return adminAction(async (admin) => {
    const parsed = idsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const rows = await prisma.product.findMany({ where: { id: { in: parsed.data.ids }, deletedAt: null }, select: { id: true, name: true } });
    const ids = rows.map((r) => r.id);
    await prisma.$transaction([
      prisma.product.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date(), status: "ARSIP" } }),
      prisma.cartItem.deleteMany({ where: { productId: { in: ids } } }),
    ]);
    for (const r of rows) await audit(prisma, admin, "produk.hapus", "Product", r.id, { before: { name: r.name } });
    done("/admin/produk");
    return ok({ deleted: rows.length, skipped: [] });
  });
}

/** Tryout yang sedang dikerjakan siswa dilewati. */
export async function hapusTryoutMassal(input: unknown): Promise<ActionResult<BulkDeleteReport>> {
  return adminAction(async (admin) => {
    const parsed = idsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const rows = await prisma.exam.findMany({
      where: { id: { in: parsed.data.ids }, deletedAt: null },
      select: { id: true, title: true, _count: { select: { attempts: { where: { status: "BERLANGSUNG" } } } } },
    });
    const report: BulkDeleteReport = { deleted: 0, skipped: [] };
    for (const e of rows) {
      if (e._count.attempts > 0) {
        report.skipped.push({ name: e.title, reason: `${e._count.attempts} siswa sedang mengerjakan` });
        continue;
      }
      await prisma.exam.update({ where: { id: e.id }, data: { deletedAt: new Date(), status: "ARSIP" } });
      await audit(prisma, admin, "tryout.hapus", "Exam", e.id, { before: { title: e.title } });
      report.deleted++;
    }
    done("/admin/tryout");
    return ok(report);
  });
}
