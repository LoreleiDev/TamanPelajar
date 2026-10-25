import type { Metadata } from "next";
import { Suspense } from "react";

import { VoucherForm } from "@/components/admin/vouchers/voucher-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { adminPage } from "@/features/admin/guard";
import { toJakartaInput } from "@/lib/datetime";

export const metadata: Metadata = { title: "Buat voucher", robots: { index: false } };

async function Content() {
  await adminPage("/admin/voucher/baru");
  const now = new Date();
  return (
    <VoucherForm
      defaults={{
        code: "",
        description: "",
        discountType: "PERSEN",
        value: "10",
        maxDiscount: "",
        minPurchase: "0",
        quota: "",
        perUserLimit: "1",
        startsAt: toJakartaInput(now),
        endsAt: toJakartaInput(new Date(now.getTime() + 30 * 86_400_000)),
        isActive: true,
      }}
    />
  );
}

export default function NewVoucherPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Voucher", href: "/admin/voucher" }, { label: "Buat voucher" }]} />
      <DashboardHeading title="Buat voucher" />
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
