"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/features/catalog/types";
import { formatRupiah } from "@/lib/format";

const examples = ["tryout skd", "penalaran", "kedinasan", "tpa"];

const normalize = (s: string) => s.toLocaleLowerCase("id-ID");

function contents(p: ProductSummary) {
  return [
    p.videoCount > 0 && `${p.videoCount} video`,
    p.tryoutCount > 0 && `${p.tryoutCount} tryout`,
    `${p.activeDays} hari`,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Judul section yang bisa diketik: pengunjung menulis ujian yang dicari dan paket yang
 * cocok langsung muncul. Tanpa JavaScript, form tetap mengirim ke katalog.
 */
export function LiveSearch({ products }: { products: ProductSummary[] }) {
  const [query, setQuery] = useState("tryout skd");
  const deferred = useDeferredValue(query);

  const results = useMemo(() => {
    const words = normalize(deferred).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return products
      .filter((p) => {
        const hay = normalize(`${p.name} ${p.summary} ${p.category.name} ${p.category.shortName}`);
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 3);
  }, [deferred, products]);

  return (
    <section aria-labelledby="cari-judul" className="bg-secondary py-20 md:py-28">
      <div className="page-container flex flex-col gap-8">
        <h2 id="cari-judul" className="text-heading max-w-[30ch] text-muted-foreground">
          Ketik ujian yang sedang kamu siapkan
        </h2>
        <form action="/program" role="search" aria-label="Cari paket belajar" data-ui>
          <label htmlFor="cari-beranda" className="sr-only">
            Cari paket belajar
          </label>
          <input
            id="cari-beranda"
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="w-full border-b-4 border-leaf/60 bg-transparent pb-3 text-[clamp(2.5rem,1rem+6vw,6.5rem)] leading-none font-extrabold tracking-tight text-primary caret-bark outline-none transition-colors duration-150 placeholder:text-primary/30 focus-visible:border-primary"
            placeholder="ketik di sini"
          />
        </form>

        <div aria-live="polite" className="max-w-2xl">
          {deferred.trim() === "" ? (
            <p className="text-muted-foreground">Tulis nama ujian, misalnya SKD, UTBK, atau TPA.</p>
          ) : results.length === 0 ? (
            <p>
              Belum ada paket untuk “{deferred}”. Coba kata lain, atau{" "}
              <Link href="/program" className="font-semibold text-primary underline underline-offset-4">
                lihat semua program
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/paket/${p.slug}`}
                    className="flex flex-col gap-1 rounded-xl bg-background px-4 py-3 transition-colors duration-150 hover:bg-accent sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                  >
                    <span className="flex flex-col">
                      <span className="font-bold">{p.name}</span>
                      <span className="text-sm text-muted-foreground">{contents(p)}</span>
                    </span>
                    <span className="font-bold tabular-nums">{formatRupiah(p.promoPrice ?? p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Contoh:</span>
          {examples.map((ex) => (
            <Button key={ex} type="button" variant="outline" size="sm" className="bg-background" onClick={() => setQuery(ex)}>
              {ex}
            </Button>
          ))}
          <Button asChild variant="link" className="ml-auto">
            <Link href={`/program?q=${encodeURIComponent(query)}`}>Lihat semua hasil di katalog</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
