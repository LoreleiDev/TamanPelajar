import Link from "next/link";

import { ProductCard } from "@/components/shared/product-card";
import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/features/catalog/types";

/** Paket rekomendasi (D.1.4): tiga paket terlaris. */
export function Recommended({ products }: { products: ProductSummary[] }) {
  return (
    <section aria-labelledby="rekomendasi-judul" className="page-container py-20 md:py-28">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <h2 id="rekomendasi-judul" className="text-title max-w-[16ch]">
            Paket yang paling banyak dipilih
          </h2>
          <p className="text-lead max-w-[48ch]">
            Diurutkan dari jumlah pembeli. Semua paket bisa dicoba gratis di bab 1 dan 2.
          </p>
        </div>
        <Button asChild variant="outline" size="lg" className="self-start md:self-auto">
          <Link href="/program?urut=terpopuler">Lihat semua paket</Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
