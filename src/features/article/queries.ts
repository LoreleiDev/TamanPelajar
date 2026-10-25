import { cacheLife, cacheTag } from "next/cache";

import { adminOnly } from "@/features/admin/guard";
import { imageUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";

import type { ArticleCategoryCode } from "./schemas";

// Artikel publik (D.4) di-cache dengan tag katalog; aksi admin memanggil updateTag("katalog").

const published = { status: "TERBIT" as const, publishedAt: { not: null } };

const cardSelect = {
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  publishedAt: true,
  cover: { select: { publicId: true } },
  author: { select: { name: true } },
} as const;

type CardRow = { slug: string; title: string; excerpt: string; category: ArticleCategoryCode; publishedAt: Date | null; cover: { publicId: string } | null; author: { name: string } };

const toCard = (a: CardRow) => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt,
  category: a.category,
  publishedAt: a.publishedAt!,
  coverUrl: a.cover ? imageUrl(a.cover.publicId, 800) : null,
  author: a.author.name,
});
export type ArticleCard = ReturnType<typeof toCard>;

export async function listPublishedArticles(category?: ArticleCategoryCode): Promise<ArticleCard[]> {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  const rows = await prisma.article.findMany({ where: { ...published, ...(category && { category }) }, orderBy: { publishedAt: "desc" }, select: cardSelect });
  return rows.map(toCard);
}

export async function listArticleSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  return (await prisma.article.findMany({ where: published, select: { slug: true } })).map((a) => a.slug);
}

/** Detail artikel publik (D.4.2): judul, cover, penulis, tanggal, isi, kategori, artikel terkait. */
export async function getArticle(slug: string) {
  "use cache";
  cacheTag("katalog");
  cacheLife("hours");
  const a = await prisma.article.findFirst({ where: { slug, ...published }, select: { ...cardSelect, body: true, updatedAt: true } });
  if (!a) return null;
  const related = await prisma.article.findMany({
    where: { ...published, category: a.category, slug: { not: slug } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: cardSelect,
  });
  return { ...toCard(a), html: sanitizeRichText(a.body), updatedAt: a.updatedAt, related: related.map(toCard) };
}

// ─── Admin ───

export async function listAdminArticles() {
  await adminOnly();
  return prisma.article.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: { id: true, slug: true, title: true, category: true, status: true, publishedAt: true, updatedAt: true, author: { select: { name: true } } },
  });
}

export async function getAdminArticle(id: string) {
  await adminOnly();
  const a = await prisma.article.findUnique({ where: { id }, include: { cover: { select: { publicId: true } }, author: { select: { name: true } } } });
  return a ? { ...a, coverUrl: a.cover ? imageUrl(a.cover.publicId, 640) : null } : null;
}
