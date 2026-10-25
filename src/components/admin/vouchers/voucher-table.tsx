"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { discountText, voucherStateView } from "@/features/admin/vouchers/labels";
import type { VoucherState } from "@/features/admin/vouchers/schemas";
import { formatRupiah, formatTanggal } from "@/lib/format";

export interface VoucherRow {
  id: string;
  code: string;
  description: string;
  discountType: "PERSEN" | "NOMINAL";
  value: number;
  maxDiscount: number | null;
  minPurchase: number;
  quota: number | null;
  used: number;
  startsAt: Date;
  endsAt: Date;
  state: VoucherState;
}

const columns: ColumnDef<VoucherRow, unknown>[] = [
  {
    accessorKey: "code",
    header: "Kode",
    meta: { rowHeader: true },
    cell: ({ row }) => (
      <>
        <Link href={`/admin/voucher/${row.original.id}`} className="font-semibold text-primary hover:underline">
          {row.original.code}
        </Link>
        <span className="block text-sm text-muted-foreground">{row.original.description}</span>
      </>
    ),
  },
  { id: "potongan", header: "Potongan", enableSorting: false, cell: ({ row }) => discountText(row.original) },
  { accessorKey: "minPurchase", header: "Min. belanja", meta: { numeric: true, hideOnMobile: true }, cell: ({ row }) => formatRupiah(row.original.minPurchase) },
  { accessorKey: "used", header: "Dipakai", meta: { numeric: true }, cell: ({ row }) => `${row.original.used}${row.original.quota ? ` / ${row.original.quota}` : ""}` },
  {
    accessorKey: "endsAt",
    header: "Masa berlaku",
    meta: { hideOnMobile: true },
    cell: ({ row }) => (
      <span className="text-sm">
        {formatTanggal(row.original.startsAt)} – {formatTanggal(row.original.endsAt)}
      </span>
    ),
  },
  {
    accessorKey: "state",
    header: "Status",
    cell: ({ row }) => <StatusBadge tone={voucherStateView[row.original.state].tone}>{voucherStateView[row.original.state].label}</StatusBadge>,
  },
];

export function VoucherTable({ rows }: { rows: VoucherRow[] }) {
  return <DataTable data={rows} columns={columns} caption="Daftar voucher" getRowId={(r) => r.id} minWidth="min-w-160" />;
}
