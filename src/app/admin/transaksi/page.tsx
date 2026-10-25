import type { Metadata } from "next";
import { Suspense } from "react";

import { FilterBar, pageHref } from "@/components/admin/filter-bar";
import { OrderTable } from "@/components/admin/orders/order-table";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { adminPage } from "@/features/admin/guard";
import { listOrders } from "@/features/admin/orders/queries";
import { ORDER_STATUSES, orderFilterSchema } from "@/features/admin/orders/schemas";
import { statusLabel } from "@/features/payment/labels";
import { formatRupiah } from "@/lib/format";
import { METHOD_LABELS } from "@/lib/payment";

export const metadata: Metadata = { title: "Transaksi", robots: { index: false } };

const nf = new Intl.NumberFormat("id-ID");

async function Content({ searchParams }: { searchParams: PageProps<"/admin/transaksi">["searchParams"] }) {
  await adminPage("/admin/transaksi");
  const filter = orderFilterSchema.parse(await searchParams);
  const data = await listOrders(filter);
  return (
    <>
      <FilterBar
        action="/admin/transaksi"
        q={filter.q}
        searchLabel="Cari transaksi"
        placeholder="Nomor pesanan, nama, atau email"
        selects={[{ name: "status", label: "Status", value: filter.status, options: ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel[s] })) }]}
      />
      <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {nf.format(data.total)} transaksi, {formatRupiah(data.paidTotal)} dari yang berhasil
      </p>
      {data.rows.length === 0 ? (
        <EmptyState title="Tidak ada transaksi yang cocok" description="Ubah kata kunci atau filter status." />
      ) : (
        <OrderTable rows={data.rows.map((r) => ({ ...r, methodLabel: r.method ? METHOD_LABELS[r.method] : "–" }))} />
      )}
      <DataPagination page={data.page} pageCount={data.pageCount} hrefFor={(p) => pageHref("/admin/transaksi", filter, p)} />
    </>
  );
}

// Kelola pembayaran (C.2.6).
export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/transaksi">) {
  return (
    <>
      <DashboardHeading title="Transaksi">Semua pesanan. Buka nomor pesanan untuk verifikasi manual, pembatalan, atau pengembalian dana.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
