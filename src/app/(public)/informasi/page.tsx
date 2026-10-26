import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listPublishedArticles, type ArticleCard } from "@/features/article/queries";
import { ARTICLE_CATEGORIES, articleCategoryLabel, articleCategorySlug, type ArticleCategoryCode } from "@/features/article/schemas";
import { formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Informasi",
  description: "Jadwal ujian, pengumuman, tips belajar, dan informasi pendaftaran dari tim Taman Pelajar.",
  alternates: { canonical: "/informasi" },
};

const bySlug = new Map(ARTICLE_CATEGORIES.map((c) => [articleCategorySlug[c], c]));

function Meta({ a }: { a: ArticleCard }) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-semibold text-primary">{articleCategoryLabel[a.category]}</span> · <time dateTime={a.publishedAt.toISOString()}>{formatTanggal(a.publishedAt)}</time>
    </p>
  );
}

async function Articles({ searchParams }: { searchParams: PageProps<"/informasi">["searchParams"] }) {
  const raw = (await searchParams).kategori;
  const category = typeof raw === "string" ? bySlug.get(raw) : undefined;
  const articles = await listPublishedArticles(category);

  return (
    <>
      <nav aria-label="Kategori informasi">
        <ul className="flex flex-wrap gap-2">
          {[undefined, ...ARTICLE_CATEGORIES].map((c: ArticleCategoryCode | undefined) => {
            const active = c === category;
            return (
              <li key={c ?? "semua"}>
                <Link
                  href={c ? `/informasi?kategori=${articleCategorySlug[c]}` : "/informasi"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors duration-150",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary",
                  )}
                >
                  {c ? articleCategoryLabel[c] : "Semua"}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {articles.length === 0 ? (
        <EmptyState title="Belum ada tulisan di kategori ini" description="Coba kategori lain atau lihat semua informasi." />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Tulisan terbaru besar di kiri, sisanya daftar ringkas di kanan. */}
          {(() => {
            const [first, ...rest] = articles;
            return (
              <>
                <article className="flex flex-col gap-4">
                  {first.coverUrl && (
                    <Image src={first.coverUrl} alt="" width={800} height={450} sizes="(min-width: 1024px) 55vw, 100vw" className="aspect-video w-full rounded-xl object-cover" />
                  )}
                  <Meta a={first} />
                  <h2 className="text-heading">
                    <Link href={`/informasi/${first.slug}`} className="hover:text-primary">
                      {first.title}
                    </Link>
                  </h2>
                  <p className="text-lead max-w-[60ch]">{first.excerpt}</p>
                  <Link href={`/informasi/${first.slug}`} className="font-semibold text-primary underline underline-offset-4">
                    Baca selengkapnya
                  </Link>
                </article>
                {rest.length > 0 && (
                  <ol className="flex flex-col gap-6">
                    {rest.map((a) => (
                      <li key={a.slug}>
                        <article className="flex flex-col gap-1.5">
                          <Meta a={a} />
                          <h2 className="text-lg font-bold">
                            <Link href={`/informasi/${a.slug}`} className="hover:text-primary">
                              {a.title}
                            </Link>
                          </h2>
                          <p className="text-muted-foreground">{a.excerpt}</p>
                        </article>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}

function ArticlesSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-busy="true" aria-label="Memuat informasi">
      <Skeleton className="aspect-video rounded-xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}

// Informasi dan artikel (D.4.1).
export default function InformasiPage({ searchParams }: PageProps<"/informasi">) {
  return (
    <main className="flex flex-col">
      <PageHeader eyebrow="Informasi" title="Kabar dan tips dari Taman Pelajar" description="Jadwal ujian, pengumuman program, tips belajar, dan persiapan pendaftaran." />
      <div className="page-container flex flex-col gap-8 py-10 md:py-12">
        <Suspense fallback={<ArticlesSkeleton />}>
          <Articles searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
