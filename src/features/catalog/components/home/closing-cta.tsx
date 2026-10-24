import Link from "next/link";

import { OrganicCorners } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";

/** Penutup beranda: coba bab gratis (G.4.10). */
export function ClosingCta() {
  return (
    <section aria-labelledby="cta-judul" className="page-container pb-20 md:pb-28">
      <div className="relative overflow-hidden rounded-2xl bg-accent px-6 py-14 md:px-12 md:py-20">
        <OrganicCorners />
        <div className="relative flex max-w-2xl flex-col gap-5">
          <h2 id="cta-judul" className="text-title text-primary uppercase">
            Coba dua bab pertama gratis
          </h2>
          <p className="text-lead max-w-[44ch]">
            Buat akun, buka bab 1 dan 2 di kelas mana pun, dan putuskan setelah tahu cara belajarnya cocok.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/daftar">Buat akun gratis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background">
              <Link href="/program">Lihat program</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
