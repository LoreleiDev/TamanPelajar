import { Suspense, type ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { HeaderWithAccount } from "@/components/layout/header-with-account";
import { SiteFooter } from "@/components/layout/site-footer";
import { SkipLink } from "@/components/layout/skip-link";

/** Kerangka halaman situs: skip link, navbar, konten, footer, dan bottom nav mobile. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
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
