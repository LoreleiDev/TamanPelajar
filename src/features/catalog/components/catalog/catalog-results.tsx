import { X } from "lucide-react";
import Link from "next/link";

import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard, ProductCardSkeleton } from "@/components/shared/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { educationLevelLabels, programTypeLabels } from "@/features/catalog/labels";
import { listCategories, searchCatalog } from "@/features/catalog/queries";
import { activeFilterCount, catalogHref, parseCatalogFilter, type SearchParams } from "@/features/catalog/schemas";
import type { CatalogFilter } from "@/features/catalog/types";
import { formatRupiah } from "@/lib/format";

import { FilterForm } from "./filter-form";
import { MobileFilter } from "./mobile-filter";
import { SortSelect } from "./sort-select";

const DESKTOP_FORM = "filter-desktop";
const rating = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

/** Filter aktif sebagai tautan yang menghapus dirinya sendiri. */
function activeChips(filter: CatalogFilter, categoryName: (slug: string) => string) {
  const chips: { label: string; href: string }[] = [];
  const reset = { halaman: 1 };
  for (const k of filter.kategori ?? [])
    chips.push({ label: categoryName(k), href: catalogHref(filter, { ...reset, kategori: filter.kategori?.filter((x) => x !== k) }) });
  for (const j of filter.jenis ?? [])
    chips.push({ label: programTypeLabels[j], href: catalogHref(filter, { ...reset, jenis: filter.jenis?.filter((x) => x !== j) }) });
  for (const j of filter.jenjang ?? [])
    chips.push({ label: educationLevelLabels[j], href: catalogHref(filter, { ...reset, jenjang: filter.jenjang?.filter((x) => x !== j) }) });
  if (filter.hargaMaks)
    chips.push({ label: `Sampai ${formatRupiah(filter.hargaMaks)}`, href: catalogHref(filter, { ...reset, hargaMaks: undefined }) });
  if (filter.ratingMin)
    chips.push({ label: `Rating ${rating.format(filter.ratingMin)}+`, href: catalogHref(filter, { ...reset, ratingMin: undefined }) });
  if (filter.q) chips.push({ label: `“${filter.q}”`, href: catalogHref(filter, { ...reset, q: undefined }) });
  return chips;
}

/** Bagian katalog yang bergantung pada URL; di-stream di dalam Suspense. */
export async function CatalogResults({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const categories = await listCategories();
  const filter = parseCatalogFilter(
    await searchParams,
    categories.map((c) => c.slug),
  );
  const result = await searchCatalog(filter);
  const nameOf = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
  const chips = activeChips(filter, nameOf);
  const filterCategories = categories.map(({ slug, name, productCount }) => ({ slug, name, productCount }));
  // Input filter memakai defaultChecked; key dari URL memaksa mount ulang saat filter
  // berubah dari luar form (chip dihapus, tombol kembali di browser).
  const formKey = catalogHref(filter, { halaman: 1 });

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14">
      <aside aria-label="Filter program" className="hidden lg:block">
        <h2 className="sr-only">Filter</h2>
        <FilterForm key={formKey} id={DESKTOP_FORM} filter={filter} categories={filterCategories} autoSubmit />
      </aside>

      <section aria-labelledby="hasil-judul" className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="hasil-judul" className="text-lg font-bold" aria-live="polite">
            <span className="tabular-nums">{result.total}</span> paket
            {filter.q && <span className="font-normal text-muted-foreground"> untuk “{filter.q}”</span>}
          </h2>
          <div className="flex items-center gap-2">
            <MobileFilter key={formKey} filter={filter} categories={filterCategories} activeCount={activeFilterCount(filter)} />
            <SortSelect key={formKey} formId={DESKTOP_FORM} value={filter.urut ?? "terpopuler"} />
          </div>
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2" aria-label="Filter aktif">
            {chips.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  scroll={false}
                  aria-label={`Hapus filter ${c.label}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent pr-2.5 pl-3 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
                >
                  {c.label}
                  <X aria-hidden="true" className="size-3.5" />
                </Link>
              </li>
            ))}
            <li>
              <Link href="/program" scroll={false} className="text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-primary">
                Hapus semua
              </Link>
            </li>
          </ul>
        )}

        {result.items.length === 0 ? (
          <EmptyState
            title="Belum ada paket yang cocok"
            description="Coba kurangi filter atau ganti kata kunci. Paket baru ditambahkan setiap bulan."
            action={
              <Button asChild>
                <Link href="/program">Tampilkan semua paket</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <DataPagination
          page={result.page}
          pageCount={result.pageCount}
          hrefFor={(page) => catalogHref(filter, { halaman: page })}
          className="pt-4"
        />
      </section>
    </div>
  );
}

/** Skeleton dengan bentuk yang sama: kolom filter dan grid kartu (P.2.4). */
export function CatalogResultsSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14" aria-busy="true" aria-label="Memuat paket">
      <div className="hidden flex-col gap-3 lg:flex" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-4/5" />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-7 w-32" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
