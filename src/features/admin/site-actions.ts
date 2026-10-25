"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { bannerSchema } from "./banner-schema";
import { adminAction, audit } from "./guard";
import { contactSettingSchema, faqSettingSchema } from "./setting-schema";
import { testimonialSchema } from "./testimonial-schema";

// Konten situs (C.2.8, M.1): testimoni, banner, dan pengaturan. Semuanya tampil di halaman
// publik yang di-cache dengan tag katalog.

const idSchema = z.object({ id: z.string().min(1) });

export async function simpanTestimoni(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = testimonialSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, ...data } = parsed.data;
    const row = id ? await prisma.testimonial.update({ where: { id }, data, select: { id: true } }) : await prisma.testimonial.create({ data, select: { id: true } });
    await audit(prisma, admin, id ? "testimoni.ubah" : "testimoni.buat", "Testimonial", row.id, { after: data });
    revalidatePath("/admin/testimoni");
    updateTag("katalog");
    return ok(null);
  });
}

export async function hapusTestimoni(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const before = await prisma.testimonial.delete({ where: { id: parsed.data.id }, select: { name: true, body: true } });
    await audit(prisma, admin, "testimoni.hapus", "Testimonial", parsed.data.id, { before });
    revalidatePath("/admin/testimoni");
    updateTag("katalog");
    return ok(null);
  });
}

/** Banner beranda (C.2.8): gambar wajib, tautan internal atau https, jadwal tayang opsional. */
export async function simpanBanner(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = bannerSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, ...data } = parsed.data;
    const media = await prisma.media.findUnique({ where: { id: data.imageId }, select: { resourceType: true } });
    if (!media || media.resourceType !== "IMAGE") return fail("Unggah gambar banner lebih dulu.", { imageId: "Gambar wajib diunggah" });
    const row = { ...data, href: data.href || null };
    const saved = id ? await prisma.banner.update({ where: { id }, data: row, select: { id: true } }) : await prisma.banner.create({ data: row, select: { id: true } });
    await audit(prisma, admin, id ? "banner.ubah" : "banner.buat", "Banner", saved.id, { after: row });
    revalidatePath("/admin/banner");
    updateTag("katalog");
    return ok(null);
  });
}

export async function hapusBanner(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const before = await prisma.banner.delete({ where: { id: parsed.data.id }, select: { title: true } });
    await audit(prisma, admin, "banner.hapus", "Banner", parsed.data.id, { before });
    revalidatePath("/admin/banner");
    updateTag("katalog");
    return ok(null);
  });
}

/** FAQ beranda (D.1.8) disimpan di Setting "beranda.faq". */
export async function simpanFaqBeranda(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = faqSettingSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const value = parsed.data.items;
    const before = await prisma.setting.findUnique({ where: { key: "beranda.faq" }, select: { value: true } });
    await prisma.setting.upsert({ where: { key: "beranda.faq" }, create: { key: "beranda.faq", value }, update: { value } });
    await audit(prisma, admin, "pengaturan.faq", "Setting", "beranda.faq", { before: before?.value, after: value });
    revalidatePath("/admin/pengaturan");
    updateTag("katalog");
    return ok(null);
  });
}

/** Kontak di halaman Hubungi kami, disimpan di Setting "kontak". */
export async function simpanKontak(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = contactSettingSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const value = parsed.data;
    const before = await prisma.setting.findUnique({ where: { key: "kontak" }, select: { value: true } });
    await prisma.setting.upsert({ where: { key: "kontak" }, create: { key: "kontak", value }, update: { value } });
    await audit(prisma, admin, "pengaturan.kontak", "Setting", "kontak", { before: before?.value, after: value });
    revalidatePath("/admin/pengaturan");
    updateTag("katalog");
    return ok(null);
  });
}

/** Judul sertifikat yang tercetak di halaman sertifikat siswa. */
export async function ubahJudulSertifikat(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = z
      .object({ id: z.string().min(1), title: z.string().trim().min(5, "Judul minimal 5 karakter").max(150, "Judul terlalu panjang") })
      .safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const before = await prisma.certificate.update({ where: { id: parsed.data.id }, data: { title: parsed.data.title }, select: { title: true } });
    await audit(prisma, admin, "sertifikat.ubah", "Certificate", parsed.data.id, { before, after: { title: parsed.data.title } });
    revalidatePath("/admin/sertifikat");
    return ok(null);
  });
}
