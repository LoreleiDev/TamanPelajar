"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { PriceTag } from "@/components/shared/price-tag";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type SubscribeProduct = { slug: string; name: string; price: number; promoPrice: number | null; activeDays: number };

/**
 * Ajakan berlangganan untuk bab terkunci (G.4.12, K.5): daftar paket yang mencakup kelas
 * ini. Pembelian dilanjutkan dari halaman paket.
 */
export function SubscribeDialog({
  trigger,
  courseTitle,
  products,
}: {
  trigger: ReactNode;
  courseTitle: string;
  products: SubscribeProduct[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-lg">
        <DialogHeader className="gap-3 text-left">
          <Lock className="size-8 text-primary" aria-hidden="true" />
          <DialogTitle className="text-xl font-bold">Bab ini untuk pelanggan</DialogTitle>
          <DialogDescription className="text-base">
            Bab 1 dan 2 {courseTitle} gratis. Bab berikutnya terbuka setelah kamu membeli salah satu paket di bawah, selama masa
            aktifnya.
          </DialogDescription>
        </DialogHeader>
        {products.length === 0 ? (
          <p className="text-muted-foreground">Belum ada paket yang menjual kelas ini. Cek lagi nanti di katalog.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {products.map((p) => (
              <li key={p.slug} className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-bold">{p.name}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">Akses {p.activeDays} hari</span>
                  <PriceTag price={p.price} promoPrice={p.promoPrice} size="sm" />
                </div>
                <Button asChild>
                  <Link href={`/paket/${p.slug}`}>Lihat paket</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
