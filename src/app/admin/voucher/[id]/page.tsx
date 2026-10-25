import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { VoucherActions } from "@/components/admin/vouchers/voucher-actions";
import { VoucherForm } from "@/components/admin/vouchers/voucher-form";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { adminPage } from "@/features/admin/guard";
import { discountText, voucherStateView } from "@/features/admin/vouchers/labels";
import { getVoucher } from "@/features/admin/vouchers/queries";
import { voucherState } from "@/features/admin/vouchers/schemas";
import { statusLabel, statusTone } from "@/features/payment/labels";
import { toJakartaInput } from "@/lib/datetime";
import { formatRupiah, formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah voucher", robots: { index: false } };

async function Content({ params }: { params: PageProps<"/admin/voucher/[id]">["params"] }) {
  const { id } = await params;
  await adminPage(`/admin/voucher/${id}`);
  const v = await getVoucher(id);
  if (!v) notFound();
  const used = v._count.usages;
  const state = voucherStateView[voucherState(v, used)];

  return (
    <>
      <Breadcrumb items={[{ label: "Voucher", href: "/admin/voucher" }, { label: v.code }]} />
      <DashboardHeading title={v.code} action={<VoucherActions id={v.id} code={v.code} active={v.isActive} used={used} />}>
        {discountText(v)}, dipakai {used}
        {v.quota ? ` dari ${v.quota}` : ""} kali
      </DashboardHeading>
      <StatusBadge tone={state.tone} variant="box">
        {state.label}
      </StatusBadge>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <VoucherForm
          defaults={{
            id: v.id,
            code: v.code,
            description: v.description,
            discountType: v.discountType,
            value: String(v.value),
            maxDiscount: v.maxDiscount === null ? "" : String(v.maxDiscount),
            minPurchase: String(v.minPurchase),
            quota: v.quota === null ? "" : String(v.quota),
            perUserLimit: String(v.perUserLimit),
            startsAt: toJakartaInput(v.startsAt),
            endsAt: toJakartaInput(v.endsAt),
            isActive: v.isActive,
          }}
        />
        <DashboardSection title="Pemakaian terakhir">
          {v.usages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum pernah dipakai.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-border text-sm">
              {v.usages.map((u) => (
                <li key={u.id} className="flex flex-col gap-0.5 py-2">
                  <span>
                    <Link href={`/admin/pengguna/${u.user.id}`} className="font-semibold hover:text-primary">
                      {u.user.name}
                    </Link>{" "}
                    hemat {formatRupiah(u.order.discount)}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                    <Link href={`/admin/transaksi/${u.order.number}`} className="hover:text-primary">
                      {u.order.number}
                    </Link>
                    <StatusBadge tone={statusTone[u.order.status]}>{statusLabel[u.order.status]}</StatusBadge>
                  </span>
                  <span className="text-muted-foreground">{formatTanggalJam(u.createdAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </DashboardSection>
      </div>
    </>
  );
}

export default function EditVoucherPage({ params }: PageProps<"/admin/voucher/[id]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
