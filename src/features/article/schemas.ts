import { z } from "zod";

import { slugField } from "@/features/admin/form-rules";

// Informasi dan artikel (D.4, C.2.8).

export const ARTICLE_CATEGORIES = ["ARTIKEL", "JADWAL_UJIAN", "PENGUMUMAN", "TIPS_BELAJAR", "PENDAFTARAN"] as const;
export type ArticleCategoryCode = (typeof ARTICLE_CATEGORIES)[number];

export const articleCategoryLabel: Record<ArticleCategoryCode, string> = {
  ARTIKEL: "Artikel pendidikan",
  JADWAL_UJIAN: "Jadwal ujian",
  PENGUMUMAN: "Pengumuman",
  TIPS_BELAJAR: "Tips belajar",
  PENDAFTARAN: "Informasi pendaftaran",
};

/** Slug kategori di URL publik: /informasi?kategori=tips-belajar. */
export const articleCategorySlug: Record<ArticleCategoryCode, string> = {
  ARTIKEL: "artikel",
  JADWAL_UJIAN: "jadwal-ujian",
  PENGUMUMAN: "pengumuman",
  TIPS_BELAJAR: "tips-belajar",
  PENDAFTARAN: "pendaftaran",
};

export const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(150, "Judul terlalu panjang"),
  slug: slugField,
  excerpt: z.string().trim().min(20, "Ringkasan minimal 20 karakter").max(300, "Ringkasan maksimal 300 karakter"),
  body: z.string().trim().min(50, "Isi minimal 50 karakter").max(200_000, "Isi terlalu panjang"),
  category: z.enum(ARTICLE_CATEGORIES, { error: "Pilih kategori" }),
  coverId: z.string().nullable(),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]),
});
export type ArticleInput = z.input<typeof articleSchema>;
