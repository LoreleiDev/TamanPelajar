import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { DotPattern, SproutMark } from "@/components/shared/ornaments";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb tunggal untuk semua halaman (satu gaya pemisah). */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight aria-hidden="true" className="size-3.5" />}
            {c.href ? (
              <Link href={c.href} className="hover:text-primary">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Kepala halaman "bedeng taman": pita hijau abu lembut selebar layar dengan tepi bawah
 * bergelombang seperti garis tanah, dan tunas kecil di eyebrow. Dipakai semua halaman
 * publik dan akun agar judul, breadcrumb, dan ringkasan selalu di tempat yang sama.
 */
export function PageHeader({
  breadcrumb,
  eyebrow,
  title,
  description,
  meta,
  aside,
  children,
  titleClassName,
}: {
  breadcrumb?: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Baris keterangan kecil di bawah deskripsi (jumlah materi, rating, tanggal). */
  meta?: ReactNode;
  /** Kolom kanan di desktop (mis. sampul paket). */
  aside?: ReactNode;
  /** Isi tambahan di bawah judul (mis. label status). */
  children?: ReactNode;
  titleClassName?: string;
}) {
  return (
    <header className="relative bg-secondary">
      <div className={cn("page-container relative grid gap-8 pt-8 pb-12 md:pt-10 md:pb-14", aside && "lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12")}>
        <div className="flex min-w-0 flex-col gap-4">
          {breadcrumb && <Breadcrumb items={breadcrumb} />}
          {eyebrow && (
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <SproutMark className="size-5" />
              {eyebrow}
            </p>
          )}
          {/* Bukan cn(): penggabung kelas menganggap text-title sebagai warna dan membuangnya. */}
          <h1 className={`text-title max-w-[24ch] text-primary ${titleClassName ?? ""}`}>{title}</h1>
          {description && <div className="text-lead max-w-[62ch]">{description}</div>}
          {meta && <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">{meta}</div>}
          {children}
        </div>
        {aside ? (
          <div className="hidden self-end lg:block">{aside}</div>
        ) : (
          <DotPattern rows={3} cols={7} className="absolute top-10 right-8 hidden text-primary/25 md:block" />
        )}
      </div>
      {/* Garis tanah: tepi bawah bergelombang dalam warna latar halaman. */}
      <svg aria-hidden="true" viewBox="0 0 1440 28" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-4 w-full text-background md:h-6">
        <path d="M0 28V16C150 4 290 22 450 18S730 2 900 8s330 18 540 4v16Z" fill="currentColor" />
      </svg>
    </header>
  );
}

/** Panel ringkasan samping (harga, total, rincian): satu gaya untuk semua halaman. */
export function SummaryPanel({
  title,
  titleId,
  children,
  sticky = true,
  className,
}: {
  title: string;
  titleId: string;
  children: ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <aside aria-labelledby={titleId} className={cn("flex flex-col gap-4 self-start rounded-xl bg-secondary p-5", sticky && "lg:sticky lg:top-24", className)}>
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      {children}
    </aside>
  );
}
