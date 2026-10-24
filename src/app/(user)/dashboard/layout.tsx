import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { HeaderWithAccount } from "@/components/layout/header-with-account";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/rbac";

/** Menu dengan jumlah notifikasi; juga mengarahkan profil yang belum lengkap (E.1.6). */
async function NavWithGuard() {
  const user = await currentUser();
  if (!user) redirect("/masuk?callbackUrl=%2Fdashboard");
  const [profile, unread] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id }, select: { completedAt: true } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  if (!profile?.completedAt) redirect("/lengkapi-profil?callbackUrl=%2Fdashboard");
  return <DashboardNav unread={unread} />;
}

// Layout dashboard siswa (F.1): padat dan fungsional, tanpa footer publik.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <>
      <HeaderWithAccount />
      {/* Kolom dasar minmax(0,1fr): tanpa ini lebar grid mengikuti isi (tab menu, grafik) dan meluber. */}
      <div className="page-container grid flex-1 grid-cols-[minmax(0,1fr)] gap-6 py-6 pb-24 md:pb-10 lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <Suspense fallback={<div className="h-10 lg:h-96" aria-hidden="true" />}>
          <NavWithGuard />
        </Suspense>
        <main id="konten" className="flex min-w-0 flex-col gap-8">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
