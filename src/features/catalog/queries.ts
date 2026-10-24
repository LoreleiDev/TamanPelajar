// Pembacaan data katalog. Tahap 1 memakai data contoh (A.6); di Tahap 2 isi fungsi
// diganti query Prisma dengan tanda tangan yang sama.

import { categories, homeFaq, platformStats, products, testimonials } from "./mock-data";
import type { CatalogFilter, CatalogPage, Category, ProductDetail, ProductSummary, SortOption } from "./types";

export const CATALOG_PAGE_SIZE = 9;

// Hanya field kartu yang dikirim, agar payload ke client tetap kecil.
function toSummary(p: ProductDetail): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    programType: p.programType,
    educationLevel: p.educationLevel,
    summary: p.summary,
    thumbnailUrl: p.thumbnailUrl,
    price: p.price,
    promoPrice: p.promoPrice,
    activeDays: p.activeDays,
    videoCount: p.videoCount,
    materialCount: p.materialCount,
    tryoutCount: p.tryoutCount,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    salesCount: p.salesCount,
    createdAt: p.createdAt,
  };
}

export const effectivePrice = (p: Pick<ProductSummary, "price" | "promoPrice">) =>
  p.promoPrice ?? p.price;

export async function listCategories(): Promise<(Category & { productCount: number })[]> {
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      ...c,
      productCount: products.filter((p) => p.category.slug === c.slug).length,
    }));
}

export async function getCategory(slug: string): Promise<Category | null> {
  return categories.find((c) => c.slug === slug) ?? null;
}

/** Paket rekomendasi beranda (D.1.4): terlaris lebih dulu. */
export async function listFeaturedProducts(limit = 3): Promise<ProductSummary[]> {
  return [...products]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, limit)
    .map(toSummary);
}

const normalize = (s: string) => s.toLocaleLowerCase("id-ID").normalize("NFKD");

function matchesQuery(p: ProductDetail, q: string) {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  const haystack = normalize(
    [p.name, p.summary, p.category.name, p.category.shortName, ...p.features].join(" "),
  );
  return words.every((w) => haystack.includes(w));
}

const sorters: Record<SortOption, (a: ProductSummary, b: ProductSummary) => number> = {
  terbaru: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  terpopuler: (a, b) => b.salesCount - a.salesCount,
  termurah: (a, b) => effectivePrice(a) - effectivePrice(b),
  termahal: (a, b) => effectivePrice(b) - effectivePrice(a),
};

/** Katalog (D.2): pencarian, filter, urutan, dan pagination. */
export async function searchCatalog(filter: CatalogFilter): Promise<CatalogPage> {
  const filtered = products
    .filter((p) => !filter.q || matchesQuery(p, filter.q))
    .filter((p) => !filter.kategori?.length || filter.kategori.includes(p.category.slug))
    .filter((p) => !filter.jenis?.length || filter.jenis.includes(p.programType))
    .filter((p) => !filter.jenjang?.length || filter.jenjang.includes(p.educationLevel))
    .filter((p) => filter.hargaMaks === undefined || effectivePrice(p) <= filter.hargaMaks)
    .filter((p) => filter.ratingMin === undefined || (p.ratingAvg ?? 0) >= filter.ratingMin)
    .map(toSummary)
    .sort(sorters[filter.urut ?? "terpopuler"]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
  const page = Math.min(Math.max(1, filter.halaman ?? 1), pageCount);
  const start = (page - 1) * CATALOG_PAGE_SIZE;

  return {
    items: filtered.slice(start, start + CATALOG_PAGE_SIZE),
    total: filtered.length,
    page,
    pageCount,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

/** Pencarian cepat untuk showcase beranda dan navbar. */
export async function quickSearch(q: string, limit = 3): Promise<ProductSummary[]> {
  if (!q.trim()) return [];
  return products
    .filter((p) => matchesQuery(p, q))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, limit)
    .map(toSummary);
}

export async function listAllProductsForSearch(): Promise<ProductSummary[]> {
  return products.map(toSummary);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return products.find((p) => p.slug === slug) ?? null;
}

export async function listProductSlugs(): Promise<string[]> {
  return products.map((p) => p.slug);
}

/** Paket serupa (D.3.11): kategori sama lebih dulu, lalu jenjang yang sama. */
export async function listRelatedProducts(product: ProductSummary, limit = 3): Promise<ProductSummary[]> {
  const score = (p: ProductDetail) =>
    (p.category.slug === product.category.slug ? 2 : 0) +
    (p.educationLevel === product.educationLevel ? 1 : 0);
  return products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => score(b) - score(a) || b.salesCount - a.salesCount)
    .slice(0, limit)
    .map(toSummary);
}

export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const prices = products.map(effectivePrice);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export async function getPlatformStats() {
  return platformStats;
}

export async function listTestimonials() {
  return testimonials;
}

export async function listHomeFaq() {
  return homeFaq;
}
