import type { MetadataRoute } from "next";

import { listArticleSlugs } from "@/features/article/queries";
import { listProductSlugs } from "@/features/catalog/queries";
import { listCourseSlugs } from "@/features/course/queries";
import { listExamSlugs } from "@/features/exam/queries";
import { listVideoSlugs } from "@/features/video/queries";

const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Sitemap halaman publik (Q.2.3). Daftar slug memakai query katalog yang sama dengan
// generateStaticParams sehingga hanya konten terbit yang masuk.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, courses, videos, exams, articles] = await Promise.all([
    listProductSlugs(),
    listCourseSlugs(),
    listVideoSlugs(),
    listExamSlugs(),
    listArticleSlugs(),
  ]);
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly") => ({
    url: `${base}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "daily"),
    page("/program", 0.9, "daily"),
    page("/kelas", 0.8, "weekly"),
    page("/video", 0.8, "weekly"),
    page("/tryout", 0.8, "weekly"),
    page("/informasi", 0.7, "daily"),
    page("/tentang", 0.4, "monthly"),
    page("/bantuan", 0.4, "monthly"),
    page("/kontak", 0.4, "monthly"),
    page("/kebijakan-privasi", 0.2, "monthly"),
    page("/syarat-ketentuan", 0.2, "monthly"),
    ...products.map((s) => page(`/paket/${s}`, 0.9, "weekly")),
    ...courses.map((s) => page(`/kelas/${s}`, 0.7, "weekly")),
    ...videos.map((s) => page(`/video/${s}`, 0.6, "weekly")),
    ...exams.map((s) => page(`/tryout/${s}`, 0.7, "weekly")),
    ...articles.map((s) => page(`/informasi/${s}`, 0.6, "monthly")),
  ];
}
