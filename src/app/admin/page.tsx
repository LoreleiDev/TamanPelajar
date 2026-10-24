import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { HeaderWithAccount } from "@/components/layout/header-with-account";
import { SproutMark } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Skeleton } from "@/components/ui/skeleton";
=======
>>>>>>> aff4f2773b8df2b079ffefbc949056eb2b7437cd
import { requireRolePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Panel admin", robots: { index: false } };

// Sementara sampai panel administrator (M) dibangun di Tahap 5.
async function AdminContent() {
  const user = await requireRolePage("ADMIN", "/admin");
  return (
    <>
      <SproutMark className="size-12" />
      <h1 className="text-title text-primary">Panel admin</h1>
      <p className="text-lead max-w-2xl">
        Halo, {user.name}. Pengelolaan pengguna, kelas, bank soal, tryout, produk, dan transaksi dibuka di Tahap 5.
      </p>
      <Button asChild size="lg" className="self-start">
        <Link href="/">Ke beranda</Link>
      </Button>
    </>
  );
}

export default function AdminPage() {
  return (
    <>
      <HeaderWithAccount />
      <main className="page-container flex flex-1 flex-col justify-center gap-6 py-16">
<<<<<<< HEAD
        <Suspense fallback={<Skeleton className="h-48 rounded-xl" aria-label="Memuat" />}>
=======
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" aria-label="Memuat" />}>
>>>>>>> aff4f2773b8df2b079ffefbc949056eb2b7437cd
          <AdminContent />
        </Suspense>
      </main>
    </>
  );
}
