import { z } from "zod";

import { slugField } from "./form-rules";

// Form video pustaka (L.2.4, H.1). Video tidak diunggah ke server: cukup URL YouTube
// (sebaiknya unlisted), Vimeo, atau berkas video eksternal (MP4/WebM).

export type VideoProviderCode = "YOUTUBE" | "VIMEO" | "EKSTERNAL";

/** Tebak penyedia dari URL; null bila URL tidak bisa diputar. */
export function detectProvider(url: string): VideoProviderCode | null {
  if (/^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{6,}/.test(url)) return "YOUTUBE";
  if (/^https:\/\/(www\.|player\.)?vimeo\.com\/(video\/)?\d+/.test(url)) return "VIMEO";
  if (/^https:\/\/\S+\.(mp4|webm|ogg)(\?\S*)?$/i.test(url)) return "EKSTERNAL";
  return null;
}

/** "12:05" atau "1:02:05" atau angka menit → detik; null bila format salah. */
export function parseClock(value: string): number | null {
  const v = value.trim();
  if (/^\d+$/.test(v)) return Number(v) * 60;
  const m = /^(?:(\d+):)?([0-5]?\d):([0-5]\d)$/.exec(v);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export const videoSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(3, "Judul minimal 3 karakter").max(150, "Judul terlalu panjang"),
    slug: slugField,
    description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(5000, "Deskripsi terlalu panjang"),
    transcript: z.string().trim().max(100_000, "Transkrip terlalu panjang"),
    url: z.string().trim().min(1, "URL video wajib diisi").max(500, "URL terlalu panjang"),
    duration: z.string().trim().min(1, "Durasi wajib diisi"),
    subject: z.string().trim().min(2, "Mata pelajaran wajib diisi").max(80, "Mata pelajaran terlalu panjang"),
    difficulty: z.enum(["MUDAH", "SEDANG", "SULIT"]),
    categoryId: z.string().min(1, "Pilih program"),
    thumbnailId: z.string().nullable(),
    status: z.enum(["DRAF", "TERBIT", "ARSIP"]),
  })
  .superRefine((v, ctx) => {
    if (!detectProvider(v.url)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Pakai URL YouTube, Vimeo, atau berkas .mp4/.webm yang diawali https://" });
    }
    const sec = parseClock(v.duration);
    if (sec === null || sec < 1 || sec > 6 * 3600) ctx.addIssue({ code: "custom", path: ["duration"], message: "Tulis durasi seperti 12:30 (menit:detik) atau 1:05:00" });
  })
  .transform((v) => ({ ...v, provider: detectProvider(v.url)!, durationSec: parseClock(v.duration)! }));

export type VideoInput = z.input<typeof videoSchema>;
