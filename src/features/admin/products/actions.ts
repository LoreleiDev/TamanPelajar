"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "../guard";
import { productSchema } from "./schemas";

const refresh = (id?: string) => {
  revalidatePath("/admin/produk");
  if (id) revalidatePath(`/admin/produk/${id}`);
  updateTag("katalog");
};

/** Buat atau ubah paket (M.4, C.2.3) beserta kelas, tryout, dan video yang termasuk. */
export async function simpanProduk(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, courseIds, examIds, videoIds, ...data } = parsed.data;
    const clash = await prisma.product.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash && clash.id !== id) return fail("Slug sudah dipakai paket lain.", { slug: "Slug ini sudah dipakai" });
    const [courses, exams, videos] = await Promise.all([
      prisma.course.count({ where: { id: { in: courseIds }, deletedAt: null } }),
      prisma.exam.count({ where: { id: { in: examIds }, deletedAt: null } }),
      prisma.video.count({ where: { id: { in: videoIds } } }),
    ]);
    if (courses !== new Set(courseIds).size || exams !== new Set(examIds).size || videos !== new Set(videoIds).size) {
      return fail("Ada kelas, tryout, atau video yang sudah dihapus. Muat ulang halaman.");
    }

    const productId = await prisma.$transaction(async (tx) => {
      const row = id ? await tx.product.update({ where: { id }, data, select: { id: true } }) : await tx.product.create({ data, select: { id: true } });
      await tx.productCourse.deleteMany({ where: { productId: row.id } });
      await tx.productExam.deleteMany({ where: { productId: row.id } });
      await tx.productVideo.deleteMany({ where: { productId: row.id } });
      if (courseIds.length) await tx.productCourse.createMany({ data: courseIds.map((courseId, order) => ({ productId: row.id, courseId, order })) });
      if (examIds.length) await tx.productExam.createMany({ data: examIds.map((examId, order) => ({ productId: row.id, examId, order })) });
      if (videoIds.length) await tx.productVideo.createMany({ data: videoIds.map((videoId) => ({ productId: row.id, videoId })) });
      return row.id;
    });
    await audit(prisma, admin, id ? "produk.ubah" : "produk.buat", "Product", productId, {
      after: { name: data.name, price: data.price, promoPrice: data.promoPrice, status: data.status, courseIds, examIds, videoIds },
    });
    refresh(productId);
    return ok({ id: productId });
  });
}

/**
 * Hapus paket (soft delete): hilang dari katalog dan keranjang, tetapi siswa yang sudah
 * membeli tetap memegang aksesnya sampai masa aktif habis.
 */
export async function hapusProduk(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const r = await prisma.product.updateMany({ where: { id: parsed.data.id, deletedAt: null }, data: { deletedAt: new Date(), status: "ARSIP" } });
    if (r.count === 0) return fail("Paket tidak ditemukan.");
    await prisma.cartItem.deleteMany({ where: { productId: parsed.data.id } });
    await audit(prisma, admin, "produk.hapus", "Product", parsed.data.id);
    refresh();
    return ok(null);
  });
}
