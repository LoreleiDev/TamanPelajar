import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Nomor halaman yang ditampilkan: awal, akhir, dan tetangga halaman aktif. */
export function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (["gap", p] as const) : [p]));
}

/** Pagination dengan next/link (D.2.5). Disembunyikan bila hanya satu halaman. */
export function DataPagination({
  page,
  pageCount,
  hrefFor,
  className,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Navigasi halaman" className={cn("flex items-center justify-center gap-1", className)}>
      {page > 1 ? (
        <Button asChild variant="ghost">
          <Link href={hrefFor(page - 1)} scroll aria-label="Ke halaman sebelumnya">
            <ChevronLeft data-icon="inline-start" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </Link>
        </Button>
      ) : (
        <Button variant="ghost" disabled aria-label="Ke halaman sebelumnya">
          <ChevronLeft data-icon="inline-start" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>
      )}
      <ul className="flex items-center gap-1">
        {pageWindow(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-2 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              <Button asChild variant={p === page ? "outline" : "ghost"} size="icon" className="tabular-nums">
                <Link href={hrefFor(p)} aria-current={p === page ? "page" : undefined} aria-label={`Halaman ${p}`}>
                  {p}
                </Link>
              </Button>
            </li>
          ),
        )}
      </ul>
      {page < pageCount ? (
        <Button asChild variant="ghost">
          <Link href={hrefFor(page + 1)} aria-label="Ke halaman berikutnya">
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight data-icon="inline-end" />
          </Link>
        </Button>
      ) : (
        <Button variant="ghost" disabled aria-label="Ke halaman berikutnya">
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight data-icon="inline-end" />
        </Button>
      )}
    </nav>
  );
}
