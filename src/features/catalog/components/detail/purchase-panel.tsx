import { CalendarClock, ClipboardList, FileText, PlayCircle } from "lucide-react";

import { BuyButton } from "@/components/shared/buy-button";
import { PriceTag } from "@/components/shared/price-tag";
import type { ProductDetail } from "@/features/catalog/types";

/**
 * Panel beli (D.3.3, D.3.10): harga, diskon, masa aktif, isi paket, tombol beli.
 * Sticky di desktop; di mobile tampil di bawah judul.
 */
export function PurchasePanel({ product }: { product: ProductDetail }) {
  const contents = [
    product.materialCount > 0 && { icon: FileText, text: `${product.materialCount} kelas online` },
    product.videoCount > 0 && { icon: PlayCircle, text: `${product.videoCount} video pembelajaran` },
    product.tryoutCount > 0 && { icon: ClipboardList, text: `${product.tryoutCount} tryout CBT` },
    { icon: CalendarClock, text: `Masa aktif ${product.activeDays} hari sejak pembayaran` },
  ].filter((x): x is { icon: typeof FileText; text: string } => Boolean(x));

  return (
    <div className="flex flex-col gap-5 rounded-xl bg-secondary p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-muted-foreground">Harga paket</h2>
        <PriceTag price={product.price} promoPrice={product.promoPrice} size="lg" />
      </div>
      <ul className="flex flex-col gap-2.5">
        {contents.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <span className="tabular-nums">{text}</span>
          </li>
        ))}
      </ul>
      <BuyButton productSlug={product.slug} productName={product.name} size="lg" className="w-full" />
      <p className="text-sm text-muted-foreground">
        Pembayaran lewat virtual account, QRIS, e-wallet, atau transfer bank. Paket aktif otomatis setelah pembayaran
        terverifikasi.
      </p>
    </div>
  );
}
