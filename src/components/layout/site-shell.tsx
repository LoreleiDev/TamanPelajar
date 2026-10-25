import { Suspense, type ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { HeaderWithAccount } from "@/components/layout/header-with-account";
import { SiteFooter } from "@/components/layout/site-footer";

/** Kerangka halaman situs: skip link, navbar, konten, footer, dan bottom nav mobile. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Lewati ke konten
      </a>
      <HeaderWithAccount />
      <div id="konten" className="flex flex-1 flex-col">
        {children}
      </div>
      <SiteFooter />
      {/* usePathname() di BottomNav butuh Suspense di rute dinamis (cacheComponents) */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
