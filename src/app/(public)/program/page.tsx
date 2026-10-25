import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
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
    <main className="flex flex-col">
      <PageHeader
        eyebrow="Mulai belajar"
        title="Katalog program"
        description="Paket untuk UTBK/SNBT, SKD CPNS, sekolah kedinasan, tes BUMN, dan tes potensi akademik. Bab 1 dan 2 setiap kelas bisa dicoba gratis."
      >
        {/* Pencarian (D.2.1); kata kunci baru memulai pencarian dari semua paket. */}
        <SearchBar action="/program" id="cari-katalog" label="Cari paket" placeholder="Contoh: tryout SKD, penalaran, TPA" />
      </PageHeader>

      <div className="page-container flex flex-col gap-10 py-10 md:py-12">

      <Suspense fallback={<CatalogResultsSkeleton />}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>
      </div>
    </main>
  );
}
