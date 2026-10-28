import { imageUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

import { adminOnly } from "./guard";

export async function listAdminTestimonials() {
  await adminOnly();
  // Testimoni siswa yang menunggu tinjauan tampil paling atas.
  return prisma.testimonial.findMany({
    orderBy: [{ isPending: "desc" }, { order: "asc" }, { createdAt: "asc" }],
    include: { user: { select: { id: true, email: true } } },
  });
}

export async function listAdminBanners() {
  await adminOnly();
  const rows = await prisma.banner.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], include: { image: { select: { publicId: true } } } });
  return rows.map(({ image, ...b }) => ({ ...b, imageUrl: imageUrl(image.publicId, 640) }));
}

export async function getSiteSettings() {
  await adminOnly();
  const rows = await prisma.setting.findMany({ where: { key: { in: ["beranda.faq", "kontak"] } } });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const faq = (byKey.get("beranda.faq") as { question: string; answer: string }[] | undefined) ?? [];
  const contact = (byKey.get("kontak") as { email?: string; jamLayanan?: string } | undefined) ?? {};
  return { faq, contact };
}
