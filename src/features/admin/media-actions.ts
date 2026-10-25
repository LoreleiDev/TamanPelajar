"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { imageUrl, verifyUploadResult } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "./guard";
import { uploadResultSchema } from "./media";

/**
 * Catat file yang baru diunggah browser ke Cloudinary sebagai Media (metadata, bukan URL
 * mentah). Signature respons diverifikasi agar metadata tidak bisa dipalsukan.
 */
export async function simpanMedia(input: unknown): Promise<ActionResult<{ id: string; url: string | null }>> {
  return adminAction(async (admin) => {
    const parsed = uploadResultSchema.safeParse(input);
    if (!parsed.success) return fail("Hasil upload tidak dikenali. Coba unggah ulang.");
    const r = parsed.data;
    if (!verifyUploadResult(r)) return fail("Hasil upload tidak sah. Coba unggah ulang.");
    const resourceType = r.resource_type === "raw" ? "RAW" : r.resource_type === "video" ? "VIDEO" : "IMAGE";
    const format = r.format || (r.public_id.toLowerCase().endsWith(".pdf") ? "pdf" : "");
    const media = await prisma.media.upsert({
      where: { publicId: r.public_id },
      create: {
        publicId: r.public_id,
        resourceType,
        format,
        version: r.version,
        bytes: r.bytes,
        width: r.width ?? null,
        height: r.height ?? null,
        deliveryType: r.type === "authenticated" ? "AUTHENTICATED" : "UPLOAD",
        folder: r.folder,
        uploadedById: admin.id,
      },
      update: { version: r.version, bytes: r.bytes },
      select: { id: true },
    });
    await audit(prisma, admin, "media.unggah", "Media", media.id, { after: { publicId: r.public_id, bytes: r.bytes } });
    return ok({ id: media.id, url: resourceType === "IMAGE" ? imageUrl(r.public_id, 640) : null });
  });
}
