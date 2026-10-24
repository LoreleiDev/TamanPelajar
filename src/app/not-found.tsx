import type { Metadata } from "next";
import Link from "next/link";

import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SproutMark } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

// Halaman 404 khusus (P.2.7).
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page-container flex flex-1 flex-col justify-center gap-6 py-20">
        <SproutMark className="size-12" />
        <p className="text-display text-primary tabular-nums">404</p>
        <h1 className="text-heading max-w-2xl">Halaman ini tidak ditemukan</h1>
        <p className="text-lead max-w-2xl">
          Alamatnya mungkin salah ketik, atau paketnya sudah tidak dijual. Coba cari dari katalog program.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/program">Buka katalog program</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
