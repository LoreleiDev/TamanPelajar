"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { statusLabel, statusTone, type OrderStatusCode } from "@/features/payment/labels";
import { formatRupiah, formatTanggalJam } from "@/lib/format";

export interface OrderRow {
  id: string;
  number: string;
  status: OrderStatusCode;
  total: number;
  discount: number;
  createdAt: Date;
  paidAt: Date | null;
  user: { id: string; name: string; email: string };
  products: string;
  methodLabel: string;
}

const columns: ColumnDef<OrderRow, unknown>[] = [
  {
    accessorKey: "number",
    header: "Nomor",
    meta: { rowHeader: true },
    cell: ({ row }) => (
      <Link href={`/admin/transaksi/${row.original.number}`} className="font-semibold whitespace-nowrap text-primary hover:underline">
        {row.original.number}
      </Link>
    ),
  },
  {
    id: "pembeli",
    accessorFn: (r) => r.user.name,
    header: "Pembeli",
    cell: ({ row }) => (
      <>
        <Link href={`/admin/pengguna/${row.original.user.id}`} className="hover:text-primary">
          {row.original.user.name}
        </Link>
        <span className="block text-sm break-all text-muted-foreground">{row.original.user.email}</span>
      </>
    ),
  },
  { accessorKey: "products", header: "Produk", meta: { hideOnMobile: true } },
  {
    accessorKey: "total",
    header: "Total",
    meta: { numeric: true },
    cell: ({ row }) => (
      <>
        {formatRupiah(row.original.total)}
        {row.original.discount > 0 && <span className="block text-sm text-muted-foreground">diskon {formatRupiah(row.original.discount)}</span>}
      </>
    ),
  },
  { accessorKey: "methodLabel", header: "Metode", meta: { hideOnMobile: true } },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge tone={statusTone[row.original.status]}>{statusLabel[row.original.status]}</StatusBadge>,
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat",
    cell: ({ row }) => <span className="text-sm">{formatTanggalJam(row.original.createdAt)}</span>,
  },
];

export function OrderTable({ rows }: { rows: OrderRow[] }) {
  return <DataTable data={rows} columns={columns} caption="Daftar transaksi" getRowId={(r) => r.id} minWidth="min-w-176" />;
}
