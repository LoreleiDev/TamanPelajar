import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { HeaderWithAccount } from "@/components/layout/header-with-account";
import { SproutMark } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

// Sementara sampai dashboard lengkap (F.1–F.3) dibangun di branch berikutnya.
async function DashboardContent() {
  const user = await requireUserPage("/dashboard");
  const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { completedAt: true } });
  if (!profile?.completedAt) redirect("/lengkapi-profil?callbackUrl=/dashboard");
  return (
    <>
      <SproutMark className="size-12" />
      <h1 className="text-title text-primary">Halo, {user.name.split(" ")[0]}</h1>
      <p className="text-lead max-w-2xl">
        Kamu sudah masuk. Ringkasan belajar, kelas, tryout, dan grafik progres sedang disiapkan di halaman ini.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/program">Lihat program</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Ke beranda</Link>
        </Button>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      <HeaderWithAccount />
      <main className="page-container flex flex-1 flex-col justify-center gap-6 py-16">
        <Suspense fallback={<Skeleton className="h-48 rounded-xl" aria-label="Memuat" />}>
          <DashboardContent />
        </Suspense>
      </main>
    </>
  );
}
