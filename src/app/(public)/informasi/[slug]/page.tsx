import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Article } from "schema-dts";

import { JsonLd } from "@/components/shared/json-ld";
import { PageHeader } from "@/components/shared/page-header";
import { getArticle, listArticleSlugs } from "@/features/article/queries";
import { articleCategoryLabel, articleCategorySlug } from "@/features/article/schemas";
import { formatTanggal } from "@/lib/format";

// Semua artikel terbit di-prerender; slug lain dirender blocking agar slug tak dikenal 404.
export const instant = false;

export async function generateStaticParams() {
  return (await listArticleSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/informasi/[slug]">): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return { title: "Artikel tidak ditemukan" };
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/informasi/${a.slug}` },
    openGraph: { title: a.title, description: a.excerpt, type: "article", publishedTime: a.publishedAt.toISOString(), ...(a.coverUrl && { images: [a.coverUrl] }) },
  };
}

// Detail artikel (D.4.2).
export default async function ArticlePage({ params }: PageProps<"/informasi/[slug]">) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="flex flex-col">
      <JsonLd<Article>
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt,
          datePublished: a.publishedAt.toISOString(),
          dateModified: a.updatedAt.toISOString(),
          author: { "@type": "Person", name: a.author },
          publisher: { "@type": "Organization", name: "Taman Pelajar", url: appUrl },
          mainEntityOfPage: `${appUrl}/informasi/${a.slug}`,
          inLanguage: "id-ID",
          ...(a.coverUrl && { image: a.coverUrl }),
        }}
      />
      <PageHeader
        breadcrumb={[
          { label: "Informasi", href: "/informasi" },
          { label: articleCategoryLabel[a.category], href: `/informasi?kategori=${articleCategorySlug[a.category]}` },
        ]}
        eyebrow={articleCategoryLabel[a.category]}
        title={a.title}
        description={a.excerpt}
        meta={
          <span>
            Oleh {a.author} · <time dateTime={a.publishedAt.toISOString()}>{formatTanggal(a.publishedAt)}</time>
          </span>
        }
        aside={a.coverUrl ? <Image src={a.coverUrl} alt="" width={720} height={405} sizes="22rem" className="aspect-video w-full rounded-xl object-cover" /> : undefined}
      />
      <div className="page-container grid gap-12 py-10 md:py-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="rich-text max-w-[68ch] text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: a.html }} />
        {a.related.length > 0 && (
          <aside aria-labelledby="artikel-terkait" className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <h2 id="artikel-terkait" className="text-lg font-bold">
              Artikel terkait
            </h2>
            <ol className="flex flex-col gap-4">
              {a.related.map((r) => (
                <li key={r.slug} className="flex flex-col gap-0.5">
                  <Link href={`/informasi/${r.slug}`} className="font-semibold hover:text-primary">
                    {r.title}
                  </Link>
                  <time dateTime={r.publishedAt.toISOString()} className="text-sm text-muted-foreground">
                    {formatTanggal(r.publishedAt)}
                  </time>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </main>
  );
}
