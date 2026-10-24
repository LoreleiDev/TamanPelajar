import { connection } from "next/server";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import type { AccountSummary } from "./account-menu";
import { SiteHeader, SiteHeaderView } from "./site-header";

async function loadAccount(): Promise<AccountSummary | null> {
  // auth() memakai crypto sebelum membaca cookie; tandai dinamis lebih dulu (cacheComponents).
  await connection();
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
      deletedAt: true,
      _count: { select: { notifications: { where: { readAt: null } } } },
    },
  });
  if (!user || !user.isActive || user.deletedAt) return null;
  return { name: user.name, email: user.email, image: user.image, role: user.role, unread: user._count.notifications };
}

async function HeaderAccount() {
  return <SiteHeader account={await loadAccount()} />;
}

/**
 * Navbar dengan bagian akun yang dibaca dari sesi. Bagian ini dinamis (cookie), jadi
 * dibungkus Suspense; fallback-nya navbar yang sama dengan placeholder akun, sehingga
 * kerangka halaman publik tetap statis.
 */
export function HeaderWithAccount() {
  return (
    <Suspense fallback={<SiteHeaderView account="loading" pathname="" />}>
      <HeaderAccount />
    </Suspense>
  );
}
