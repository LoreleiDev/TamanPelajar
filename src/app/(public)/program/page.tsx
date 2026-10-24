import { Search } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { CatalogResults, CatalogResultsSkeleton } from "@/features/catalog/components/catalog/catalog-results";

export const metadata: Metadata = {
  title: "Katalog program",
  description:
    "Paket belajar UTBK/SNBT, SKD CPNS, sekolah kedinasan, tes BUMN, dan tes potensi akademik. Cari, filter berdasarkan harga dan jenjang, lalu bandingkan isi paketnya.",
  alternates: { canonical: "/program" },
};

// Katalog program (D.2). Kerangka halaman statis; hasil bergantung URL dan di-stream.
export default function ProgramPage({ searchParams }: PageProps<"/program">) {
  return (
    <main className="page-container flex flex-col gap-10 py-12 md:py-16">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-title text-primary">Katalog program</h1>
          <p className="text-lead max-w-[56ch]">
            Paket untuk UTBK/SNBT, SKD CPNS, sekolah kedinasan, tes BUMN, dan tes potensi akademik. Bab 1 dan 2
            setiap kelas bisa dicoba gratis.
          </p>
        </div>
        {/* Pencarian (D.2.1); kata kunci baru memulai pencarian dari semua paket. */}
        <Form action="/program" role="search" className="flex max-w-2xl gap-2">
          <label htmlFor="cari-katalog" className="sr-only">
            Cari paket
          </label>
          <div className="relative flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="cari-katalog"
              name="q"
              type="search"
              placeholder="Contoh: tryout SKD, penalaran, TPA"
              className="h-12 w-full rounded-xl border border-input bg-background pr-3 pl-11 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button type="submit" size="lg">
            Cari
          </Button>
        </Form>
      </header>

      <Suspense fallback={<CatalogResultsSkeleton />}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
