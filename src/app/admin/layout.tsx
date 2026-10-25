import { Suspense } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { HeaderWithAccount } from "@/components/layout/header-with-account";
import { SkipLink } from "@/components/layout/skip-link";
import { adminPage } from "@/features/admin/guard";
import { getAdminBadges } from "@/features/admin/queries";

async function NavWithGuard() {
  await adminPage("/admin");
  return <AdminNav badges={await getAdminBadges()} />;
}

// Layout panel administrator (M.1): padat dan fungsional, tanpa footer publik.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SkipLink />
      <HeaderWithAccount />
      <div className="page-container grid flex-1 grid-cols-[minmax(0,1fr)] gap-6 py-6 pb-12 lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:gap-10 lg:py-8">
        <Suspense fallback={<div className="h-10 lg:h-96" aria-hidden="true" />}>
          <NavWithGuard />
        </Suspense>
        <main id="konten" className="flex min-w-0 flex-col gap-8">
          {children}
        </main>
      </div>
    </>
  );
}
