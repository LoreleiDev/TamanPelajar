import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationList } from "@/components/shared/notification-list";
import { getNotifications } from "@/features/dashboard/queries";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Notifikasi", robots: { index: false } };

async function Content() {
  const user = await requireUserPage("/dashboard/notifikasi");
  const items = await getNotifications(user.id);
  return (
    <>
      <DashboardHeading title="Notifikasi">Pemberitahuan pembayaran, tryout, kelas, dan sistem.</DashboardHeading>
      {items.length === 0 ? (
        <EmptyState title="Belum ada notifikasi" description="Pemberitahuan tentang pembayaran, hasil tryout, dan sertifikat akan muncul di sini." />
      ) : (
        <NotificationList items={items} />
      )}
    </>
  );
}

// Notifikasi (F.1, B.2.4).
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
