import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { Category } from "@/features/catalog/types";

/**
 * Program populer (D.1.3) sebagai daftar satu ukuran huruf: nama program, siapa
 * pesertanya, dan jumlah paket, diatur oleh kolom tetap, bukan kartu.
 */
export function ProgramLineup({ categories }: { categories: (Category & { productCount: number })[] }) {
  return (
    <section aria-labelledby="program-judul" className="page-container py-20 md:py-28">
      <div className="mb-10 flex flex-col gap-3 md:mb-14">
        <h2 id="program-judul" className="text-title max-w-[18ch]">
          Pilih program sesuai ujianmu
        </h2>
        <p className="text-lead max-w-[52ch]">
          {new Intl.NumberFormat("id-ID").format(categories.length)} program dengan kisi-kisi masing-masing. Klik satu program untuk
          melihat paketnya.
        </p>
      </div>
      <ul className="flex flex-col">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/program?kategori=${c.slug}`}
              className="group grid gap-x-6 gap-y-1 rounded-xl px-3 py-4 transition-colors duration-150 hover:bg-accent md:grid-cols-[2fr_2fr_1fr_auto] md:items-baseline md:py-5"
            >
              <span className="text-[clamp(1.375rem,1rem+1.2vw,1.875rem)] leading-tight font-bold text-foreground group-hover:text-primary">
                {c.name}
              </span>
              <span className="text-foreground/85 md:text-lg">{c.audience}</span>
              <span className="text-sm text-muted-foreground tabular-nums md:text-right md:text-lg">
                {c.productCount} paket
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="hidden size-6 text-primary transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:block"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
