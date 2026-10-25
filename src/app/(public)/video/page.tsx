import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { VideoCard } from "@/components/course/video-card";
import { VideoFilters } from "@/components/course/video-filters";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { searchVideos } from "@/features/video/queries";
import { parseVideoFilter, videoHref } from "@/features/video/schemas";
import { currentUser } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Video belajar",
  description: "Pustaka video per topik untuk UTBK/SNBT dan SKD: penalaran, kuantitatif, literasi, TWK, TIU, dan TKP.",
  alternates: { canonical: "/video" },
};

async function Library({ searchParams }: { searchParams: PageProps<"/video">["searchParams"] }) {
  const filter = parseVideoFilter(await searchParams);
  const user = await currentUser();
  const result = await searchVideos(filter, user);
  // key dari URL: select memakai defaultValue sehingga perlu mount ulang saat filter berubah.
  const formKey = videoHref(filter, { halaman: 1 });

  return (
    <div className="flex flex-col gap-6">
      <VideoFilters key={formKey} filter={filter} categories={result.facets.categories} subjects={result.facets.subjects} loggedIn={Boolean(user)} />
      <h2 className="text-lg font-bold" aria-live="polite">
        <span className="tabular-nums">{result.total}</span> video
      </h2>
      {result.items.length === 0 ? (
        <EmptyState
          title="Tidak ada video yang cocok"
          description="Coba kurangi filter atau ganti kata kunci."
          action={
            <Button asChild>
              <Link href="/video">Tampilkan semua video</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.items.map((v) => (
            <VideoCard key={v.slug} video={v} />
          ))}
        </div>
      )}
      <DataPagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => videoHref(filter, { halaman: p })} className="pt-2" />
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Memuat video">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ))}
    </div>
  );
}

// Pustaka video (H.1).
export default function VideoPage({ searchParams }: PageProps<"/video">) {
  return (
    <main className="flex flex-col">
      <PageHeader
        eyebrow="Pustaka video"
        title="Video belajar"
        description="Video per topik dari semua kelas. Video di bab 1 dan 2 bisa ditonton gratis setelah masuk; sisanya terbuka lewat paket."
      >
        <SearchBar action="/video" id="cari-video" label="Cari video" placeholder="Contoh: deret angka, silogisme, pancasila" />
      </PageHeader>
      <div className="page-container flex flex-col gap-8 py-10 md:py-12">
      <Suspense fallback={<LibrarySkeleton />}>
        <Library searchParams={searchParams} />
      </Suspense>
      </div>
    </main>
  );
}
