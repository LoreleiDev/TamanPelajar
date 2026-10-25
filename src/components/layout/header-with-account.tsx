import { connection } from "next/server";
import { cache, Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { DesktopAccount, MobileAccountSlot, type AccountSummary } from "./account-menu";
import { SiteHeader } from "./site-header";

/** Sekali per request walau dipakai slot desktop dan mobile. */
const loadAccount = cache(async (): Promise<AccountSummary | null> => {
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
      cart: { select: { _count: { select: { items: true } } } },
      _count: { select: { notifications: { where: { readAt: null } } } },
    },
  });
  if (!user || !user.isActive || user.deletedAt) return null;
  return {
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    unread: user._count.notifications,
    cartCount: user.cart?._count.items ?? 0,
  };
});

async function DesktopSlot() {
  return <DesktopAccount account={await loadAccount()} />;
}

async function MobileSlot() {
  return <MobileAccountSlot account={await loadAccount()} />;
}

/**
 * Navbar dengan bagian akun dari sesi. Hanya slot akun yang dinamis (cookie) dan dibungkus
 * Suspense; kerangka navbar, termasuk kolom pencarian, tetap statis.
 */
export function HeaderWithAccount() {
  return (
    <SiteHeader
      account={
        <Suspense fallback={<Skeleton aria-hidden="true" className="hidden size-10 rounded-full sm:block" />}>
          <DesktopSlot />
        </Suspense>
      }
      mobileAccount={
        <Suspense fallback={null}>
          <MobileSlot />
        </Suspense>
      }
    />
  );
}
