import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Lewati ke konten
      </a>
      <SiteHeader />
      <div id="konten" className="flex flex-1 flex-col">
        {children}
      </div>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
