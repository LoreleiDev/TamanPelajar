import { CircleAlert, RefreshCw, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RemoveFromCart } from "@/components/checkout/remove-from-cart";
import { EmptyState } from "@/components/shared/empty-state";
import { PriceTag } from "@/components/shared/price-tag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, SummaryPanel } from "@/components/shared/page-header";
import { getCart } from "@/features/cart/queries";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Keranjang", robots: { index: false } };

async function Content() {
  const user = await requireUserPage("/keranjang");
  const cart = await getCart(user.id);
  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Keranjangmu masih kosong"
        description="Pilih paket kelas atau tryout di katalog, lalu tekan Beli sekarang."
        action={
          <Button asChild>
            <Link href="/program">Lihat katalog program</Link>
          </Button>
        }
      />
    );
  }
  const blocked = cart.items.some((i) => !i.available);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <ul className="flex flex-col gap-3" aria-label="Isi keranjang">
        {cart.items.map((i) => (
          <li key={i.productId} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-semibold text-primary">{i.category}</p>
              <Link href={`/paket/${i.slug}`} className="text-lg font-bold hover:text-primary">
                {i.name}
              </Link>
              <p className="text-sm text-muted-foreground tabular-nums">Masa aktif {i.activeDays} hari sejak pembayaran</p>
              {i.activeUntil && (
                <p className="flex items-start gap-1.5 text-sm">
                  <RefreshCw aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  Paket ini masih aktif sampai {formatTanggal(i.activeUntil)}. Pembelian ini menambah {i.activeDays} hari dari tanggal itu.
                </p>
              )}
              {!i.available && (
                <p className="flex items-start gap-1.5 text-sm font-semibold text-destructive" role="alert">
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Paket ini sudah tidak dijual. Hapus dari keranjang untuk melanjutkan.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
              <PriceTag price={i.price} promoPrice={i.promoPrice} size="sm" />
              <RemoveFromCart productId={i.productId} name={i.name} />
            </div>
          </li>
        ))}
      </ul>
      <SummaryPanel title="Ringkasan" titleId="ringkasan-judul">
        <dl className="flex justify-between gap-4 tabular-nums">
          <dt>Subtotal ({cart.items.filter((i) => i.available).length} paket)</dt>
          <dd className="font-bold">{formatRupiah(cart.subtotal)}</dd>
        </dl>
        <p className="text-sm text-muted-foreground">Kode voucher dan metode pembayaran dipilih di langkah berikutnya.</p>
        {blocked ? (
          <Button size="lg" disabled>
            Lanjut ke pembayaran
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href="/checkout">
              <ShoppingBag aria-hidden="true" data-icon="inline-start" />
              Lanjut ke pembayaran
            </Link>
          </Button>
        )}
      </SummaryPanel>
    </div>
  );
}

// Keranjang (K.1).
export default function KeranjangPage() {
  return (
    <main className="flex flex-col">
      <PageHeader eyebrow="Langkah 1 dari 3: periksa paket" title="Keranjang" />
      <div className="page-container flex flex-col gap-8 py-10 md:py-12">
      <Suspense
        fallback={
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Memuat keranjang">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        }
      >
        <Content />
      </Suspense>
      </div>
    </main>
  );
}
