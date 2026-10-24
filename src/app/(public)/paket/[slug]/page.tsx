import { ChevronDown, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { Course } from "schema-dts";

import { CheckList } from "@/components/shared/check-list";
import { JsonLd } from "@/components/shared/json-ld";
import { ProductCard } from "@/components/shared/product-card";
import { ProductCover } from "@/components/shared/product-cover";
import { Rating } from "@/components/shared/rating";
import { PurchasePanel } from "@/features/catalog/components/detail/purchase-panel";
import { Reviews } from "@/features/catalog/components/detail/reviews";
import { Syllabus } from "@/features/catalog/components/detail/syllabus";
import { educationLevelLabels, programTypeLabels } from "@/features/catalog/labels";
import { effectivePrice, getProductBySlug, listProductSlugs, listRelatedProducts } from "@/features/catalog/queries";

export async function generateStaticParams() {
  return (await listProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/paket/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Paket tidak ditemukan" };
  return {
    title: product.name,
    description: product.summary,
    alternates: { canonical: `/paket/${product.slug}` },
    openGraph: { title: product.name, description: product.summary, type: "website" },
  };
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className="flex scroll-mt-24 flex-col gap-5">
      <h2 id={`${id}-judul`} className="text-heading">
        {title}
      </h2>
      {children}
    </section>
  );
}

// Detail paket (D.3).
export default async function PaketPage({ params }: PageProps<"/paket/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await listRelatedProducts(product, 3);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const sections = [
    { id: "deskripsi", label: "Deskripsi" },
    { id: "isi-paket", label: "Isi paket" },
    ...(product.courses.length ? [{ id: "silabus", label: "Silabus" }] : []),
    { id: "ulasan", label: "Ulasan" },
    { id: "faq", label: "Pertanyaan" },
  ];

  return (
    <main className="flex flex-col">
      <JsonLd<Course>
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: product.name,
          description: product.summary,
          url: `${appUrl}/paket/${product.slug}`,
          inLanguage: "id-ID",
          provider: { "@type": "Organization", name: "Taman Pelajar", url: appUrl },
          offers: {
            "@type": "Offer",
            price: effectivePrice(product),
            priceCurrency: "IDR",
            category: "Paid",
            availability: "https://schema.org/InStock",
          },
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: `P${product.activeDays}D`,
          },
          ...(product.ratingAvg !== null && product.ratingCount > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.ratingAvg,
                  ratingCount: product.ratingCount,
                  bestRating: 5,
                },
              }
            : {}),
        }}
      />

      {/* Banner dan nama paket (D.3.1) */}
      <header className="bg-secondary">
        <div className="page-container grid gap-8 py-10 md:py-14 lg:grid-cols-[1fr_22rem] lg:gap-12">
          <div className="flex flex-col gap-5">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-primary">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="size-3.5" />
                </li>
                <li>
                  <Link href="/program" className="hover:text-primary">
                    Katalog
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="size-3.5" />
                </li>
                <li>
                  <Link href={`/program?kategori=${product.category.slug}`} className="hover:text-primary">
                    {product.category.name}
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 className="text-title max-w-[22ch] text-primary">{product.name}</h1>
            <p className="text-lead max-w-[56ch]">{product.summary}</p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="font-semibold">{programTypeLabels[product.programType]}</span>
              <span>Jenjang {educationLevelLabels[product.educationLevel]}</span>
              <Rating value={product.ratingAvg} count={product.ratingCount} />
            </p>
          </div>
          <ProductCover product={product} className="hidden rounded-2xl lg:flex lg:self-end" sizes="(min-width: 1024px) 22rem, 100vw" />
        </div>
      </header>

      <div className="page-container grid gap-12 py-10 md:py-14 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <aside aria-label="Pembelian" className="lg:order-2">
          <div className="lg:sticky lg:top-24">
            <PurchasePanel product={product} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-14 lg:order-1">
          <nav aria-label="Bagian halaman" className="-mb-4 overflow-x-auto">
            <ul className="flex gap-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex h-9 items-center rounded-full bg-secondary px-4 text-sm font-semibold whitespace-nowrap hover:bg-accent hover:text-primary"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Block id="deskripsi" title="Tentang paket ini">
            <div className="flex max-w-[68ch] flex-col gap-4 text-[1.0625rem] leading-relaxed">
              {product.description.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
            <h3 className="mt-2 text-lg font-bold">Yang kamu dapat</h3>
            <CheckList items={product.features} className="max-w-[68ch]" />
          </Block>

          <Block id="isi-paket" title="Isi paket">
            {product.courses.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[30rem] text-left">
                  <caption className="px-4 pt-4 pb-2 text-left font-bold">Kelas online dan video</caption>
                  <thead className="bg-secondary text-sm">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Kelas</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Bab</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Materi</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Video</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {product.courses.map((c) => (
                      <tr key={c.slug} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                        <th scope="row" className="px-4 py-3 font-semibold">{c.title}</th>
                        <td className="px-4 py-3 text-right">{c.sections.length}</td>
                        <td className="px-4 py-3 text-right">{c.lessonCount}</td>
                        <td className="px-4 py-3 text-right">{c.videoCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {product.exams.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[30rem] text-left">
                  <caption className="px-4 pt-4 pb-2 text-left font-bold">Tryout CBT</caption>
                  <thead className="bg-secondary text-sm">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Tryout</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Subtes</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Soal</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {product.exams.map((e) => (
                      <tr key={e.slug} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                        <th scope="row" className="px-4 py-3 font-semibold">{e.title}</th>
                        <td className="px-4 py-3 text-muted-foreground">{e.sectionNames.join(", ")}</td>
                        <td className="px-4 py-3 text-right">{e.questionCount}</td>
                        <td className="px-4 py-3 text-right">{e.durationMin} menit</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Block>

          {product.courses.length > 0 && (
            <Block id="silabus" title="Silabus">
              <p className="max-w-[60ch]">
                Bab 1 dan 2 setiap kelas bisa dibuka gratis setelah membuat akun. Bab berikutnya terbuka setelah paket
                dibeli, selama masa aktif.
              </p>
              <Syllabus courses={product.courses} />
            </Block>
          )}

          <Block id="ulasan" title="Rating dan ulasan">
            <Reviews product={product} />
          </Block>

          <Block id="faq" title="Pertanyaan umum">
            <div className="flex flex-col gap-2">
              {product.faq.map((f) => (
                <details key={f.question} className="group rounded-xl open:bg-accent">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3.5 font-semibold hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform duration-150 group-open:rotate-180" />
                  </summary>
                  <p className="max-w-[60ch] px-4 pb-4 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </Block>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="serupa-judul" className="bg-secondary py-16 md:py-20">
          <div className="page-container flex flex-col gap-8">
            <h2 id="serupa-judul" className="text-heading">
              Paket serupa
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
