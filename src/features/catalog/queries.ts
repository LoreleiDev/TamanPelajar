// Pembacaan data katalog dari database (Prisma). Hasil di-cache dengan tag "katalog";
// aksi admin yang mengubah produk, kelas, atau ulasan memanggil revalidateTag("katalog").

import { cacheLife, cacheTag } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type {
  CatalogFilter,
  CatalogPage,
  Category,
  FaqItem,
  IncludedCourse,
  IncludedExam,
  PlatformStats,
  ProductDetail,
  ProductSummary,
  SortOption,
  Testimonial,
} from "./types";

export const CATALOG_PAGE_SIZE = 9;

function cached() {
  cacheTag("katalog");
  cacheLife("hours");
}

const published = { status: "TERBIT", deletedAt: null } satisfies Prisma.ProductWhereInput;

const summaryInclude = {
  category: { select: { slug: true, name: true, shortName: true } },
  courses: {
    select: { course: { select: { sections: { select: { lessons: { select: { videoId: true } } } } } } },
  },
  _count: { select: { exams: true } },
  reviews: { where: { isPublished: true }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

type SummaryRow = Prisma.ProductGetPayload<{ include: typeof summaryInclude }>;

function toSummary(p: SummaryRow): ProductSummary {
  const ratings = p.reviews.map((r) => r.rating);
  const videoCount = p.courses.reduce(
    (n, { course }) => n + course.sections.reduce((m, s) => m + s.lessons.filter((l) => l.videoId).length, 0),
    0,
  );
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    programType: p.programType,
    educationLevel: p.educationLevel,
    summary: p.summary,
    thumbnailUrl: null, // TODO Tahap 5: URL Cloudinary dari thumbnailId
    price: p.price,
    promoPrice: p.promoPrice,
    activeDays: p.activeDays,
    videoCount,
    materialCount: p.courses.length,
    tryoutCount: p._count.exams,
    ratingAvg: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    ratingCount: ratings.length,
    salesCount: p.salesCount,
    createdAt: p.createdAt,
  };
}

export const effectivePrice = (p: Pick<ProductSummary, "price" | "promoPrice">) => p.promoPrice ?? p.price;

async function allSummaries(): Promise<ProductSummary[]> {
  "use cache";
  cached();
  const rows = await prisma.product.findMany({ where: published, include: summaryInclude });
  return rows.map(toSummary);
}

export async function listCategories(): Promise<(Category & { productCount: number })[]> {
  "use cache";
  cached();
  const rows = await prisma.courseCategory.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: { where: published } } } },
  });
  return rows.map(({ _count, ...c }) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    shortName: c.shortName,
    description: c.description,
    audience: c.audience,
    order: c.order,
    productCount: _count.products,
  }));
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await listCategories()).find((c) => c.slug === slug) ?? null;
}

/** Paket rekomendasi beranda (D.1.4): terlaris lebih dulu. */
export async function listFeaturedProducts(limit = 3): Promise<ProductSummary[]> {
  return [...(await allSummaries())].sort((a, b) => b.salesCount - a.salesCount).slice(0, limit);
}

export async function listAllProductsForSearch(): Promise<ProductSummary[]> {
  return allSummaries();
}

const normalize = (s: string) => s.toLocaleLowerCase("id-ID").normalize("NFKD");

function matchesQuery(p: ProductSummary, q: string) {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  const haystack = normalize([p.name, p.summary, p.category.name, p.category.shortName].join(" "));
  return words.every((w) => haystack.includes(w));
}

const sorters: Record<SortOption, (a: ProductSummary, b: ProductSummary) => number> = {
  terbaru: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  terpopuler: (a, b) => b.salesCount - a.salesCount,
  termurah: (a, b) => effectivePrice(a) - effectivePrice(b),
  termahal: (a, b) => effectivePrice(b) - effectivePrice(a),
};

/**
 * Katalog (D.2). Katalog dimuat sekali (di-cache) lalu difilter di server karena rating
 * adalah rata-rata relasi yang tidak bisa difilter langsung oleh Prisma.
 */
export async function searchCatalog(filter: CatalogFilter): Promise<CatalogPage> {
  const filtered = (await allSummaries())
    .filter((p) => !filter.q || matchesQuery(p, filter.q))
    .filter((p) => !filter.kategori?.length || filter.kategori.includes(p.category.slug))
    .filter((p) => !filter.jenis?.length || filter.jenis.includes(p.programType))
    .filter((p) => !filter.jenjang?.length || filter.jenjang.includes(p.educationLevel))
    .filter((p) => filter.hargaMaks === undefined || effectivePrice(p) <= filter.hargaMaks)
    .filter((p) => filter.ratingMin === undefined || (p.ratingAvg ?? 0) >= filter.ratingMin)
    .sort(sorters[filter.urut ?? "terpopuler"]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
  const page = Math.min(Math.max(1, filter.halaman ?? 1), pageCount);
  const start = (page - 1) * CATALOG_PAGE_SIZE;
  return { items: filtered.slice(start, start + CATALOG_PAGE_SIZE), total: filtered.length, page, pageCount, pageSize: CATALOG_PAGE_SIZE };
}

/** Nama ulasan ditampilkan sebagai nama depan dan inisial (kebijakan privasi). */
const shortName = (name: string) => {
  const [first, second] = name.trim().split(/\s+/);
  return second ? `${first} ${second[0]}.` : first;
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cached();
  const p = await prisma.product.findFirst({
    where: { slug, ...published },
    include: {
      category: summaryInclude.category,
      courses: {
        orderBy: { order: "asc" },
        select: {
          course: {
            select: {
              slug: true,
              title: true,
              sections: {
                orderBy: { order: "asc" },
                select: { title: true, isFree: true, lessons: { orderBy: { order: "asc" }, select: { title: true, videoId: true } } },
              },
            },
          },
        },
      },
      exams: {
        orderBy: { order: "asc" },
        select: {
          exam: {
            select: {
              slug: true,
              title: true,
              durationMin: true,
              sections: { orderBy: { order: "asc" }, select: { title: true } },
              _count: { select: { questions: true } },
            },
          },
        },
      },
      reviews: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, body: true, createdAt: true, user: { select: { name: true } } },
      },
    },
  });
  if (!p) return null;

  const courses: IncludedCourse[] = p.courses.map(({ course }) => ({
    slug: course.slug,
    title: course.title,
    lessonCount: course.sections.reduce((n, s) => n + s.lessons.length, 0),
    videoCount: course.sections.reduce((n, s) => n + s.lessons.filter((l) => l.videoId).length, 0),
    sections: course.sections.map((s) => ({ title: s.title, isFree: s.isFree, lessons: s.lessons.map((l) => l.title) })),
  }));
  const exams: IncludedExam[] = p.exams.map(({ exam }) => ({
    slug: exam.slug,
    title: exam.title,
    durationMin: exam.durationMin,
    questionCount: exam._count.questions,
    sectionNames: exam.sections.map((s) => s.title),
  }));

  return {
    ...toSummary({ ...p, _count: { exams: p.exams.length } }),
    description: p.description.split(/\n{2,}/),
    features: p.features as string[],
    faq: p.faq as unknown as FaqItem[],
    courses,
    exams,
    reviews: p.reviews.map((r) => ({
      id: r.id,
      userName: shortName(r.user.name),
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
    })),
  };
}

export async function listProductSlugs(): Promise<string[]> {
  return (await allSummaries()).map((p) => p.slug);
}

/** Paket serupa (D.3.11): kategori sama lebih dulu, lalu jenjang yang sama. */
export async function listRelatedProducts(product: ProductSummary, limit = 3): Promise<ProductSummary[]> {
  const score = (p: ProductSummary) =>
    (p.category.slug === product.category.slug ? 2 : 0) + (p.educationLevel === product.educationLevel ? 1 : 0);
  return (await allSummaries())
    .filter((p) => p.id !== product.id)
    .sort((a, b) => score(b) - score(a) || b.salesCount - a.salesCount)
    .slice(0, limit);
}

/** Statistik beranda (D.1.6), dihitung langsung dari database. */
export async function getPlatformStats(): Promise<PlatformStats> {
  "use cache";
  cached();
  const [students, courses, questions, finishedTryouts] = await Promise.all([
    prisma.user.count({ where: { role: "USER", deletedAt: null } }),
    prisma.course.count({ where: { status: "TERBIT", deletedAt: null } }),
    prisma.question.count({ where: { status: "TERBIT", deletedAt: null } }),
    prisma.examAttempt.count({ where: { status: "SELESAI" } }),
  ]);
  return { students, courses, questions, finishedTryouts };
}

export async function listTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cached();
  const rows = await prisma.testimonial.findMany({ where: { isPublished: true }, orderBy: { order: "asc" } });
  return rows.map((t) => ({ id: t.id, name: t.name, program: t.program, opening: t.opening, body: t.body.split(/\n{2,}/) }));
}

export async function listHomeFaq(): Promise<FaqItem[]> {
  "use cache";
  cached();
  const row = await prisma.setting.findUnique({ where: { key: "beranda.faq" } });
  return (row?.value as unknown as FaqItem[] | undefined) ?? [];
}
