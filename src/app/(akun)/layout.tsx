import { SiteShell } from "@/components/layout/site-shell";

// Keranjang, checkout, dan transaksi (K): butuh masuk (proxy.ts), memakai kerangka situs.
export default function AkunLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
