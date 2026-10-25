import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { VoucherTable } from "@/components/admin/vouchers/voucher-table";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { listVouchers } from "@/features/admin/vouchers/queries";

export const metadata: Metadata = { title: "Voucher", robots: { index: false } };

async function Content() {
  await adminPage("/admin/voucher");
  const rows = await listVouchers();
  return rows.length === 0 ? (
    <EmptyState title="Belum ada voucher" description="Buat kode promo pertama: potongan persen atau nominal, dengan kuota dan masa berlaku." />
  ) : (
    <VoucherTable rows={rows} />
  );
}

// Kelola promo (C.2.7).
export default function AdminVouchersPage() {
  return (
    <>
      <DashboardHeading
        title="Voucher"
        action={
          <Button asChild>
            <Link href="/admin/voucher/baru">
              <Plus data-icon="inline-start" />
              Buat voucher
            </Link>
          </Button>
        }
      >
        Kode promo untuk checkout. Voucher yang sudah dipakai tidak bisa dihapus, cukup dinonaktifkan.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
