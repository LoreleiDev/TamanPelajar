import { v2 as cloudinary } from "cloudinary";

// Cloudinary hanya dipakai di server; API secret tidak pernah dikirim ke client.
// Konfigurasi dibaca saat dipakai agar build tanpa variabel Cloudinary tetap berjalan.

export function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function client() {
  if (!cloudinaryConfigured()) throw new Error("Variabel CLOUDINARY_* belum diisi");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/**
 * Signed URL berumur pendek untuk file berbayar (delivery authenticated), dibuat setelah
 * akses diperiksa di server (G.4.4, C.1.4).
 */
export function signedDownloadUrl(
  media: { publicId: string; format: string; resourceType: "IMAGE" | "RAW" | "VIDEO" },
  expiresInSec = 5 * 60,
) {
  const resourceType = media.resourceType.toLowerCase() as "image" | "raw" | "video";
  return client().utils.private_download_url(media.publicId, media.format, {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSec,
    attachment: true,
  });
}

/** URL gambar publik dengan transformasi otomatis f_auto,q_auto. */
export function imageUrl(publicId: string, width: number) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
}
