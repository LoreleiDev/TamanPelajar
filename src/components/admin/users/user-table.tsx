"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { roleLabel } from "@/features/admin/labels";
import { formatTanggal } from "@/lib/format";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  paidOrders: number;
  activePrograms: number;
}

const columns: ColumnDef<UserRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    meta: { rowHeader: true },
    cell: ({ row }) => (
      <>
        <Link href={`/admin/pengguna/${row.original.id}`} className="font-semibold text-primary hover:underline">
          {row.original.name}
        </Link>
        <span className="block text-sm break-all text-muted-foreground">{row.original.email}</span>
      </>
    ),
  },
  { accessorKey: "role", header: "Role", cell: ({ row }) => roleLabel[row.original.role] },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => <StatusBadge tone={row.original.isActive ? "berhasil" : "gagal"}>{row.original.isActive ? "Aktif" : "Nonaktif"}</StatusBadge>,
  },
  { accessorKey: "activePrograms", header: "Program aktif", meta: { numeric: true } },
  { accessorKey: "paidOrders", header: "Transaksi", meta: { numeric: true } },
  {
    accessorKey: "createdAt",
    header: "Terdaftar",
    meta: { hideOnMobile: true },
    cell: ({ row }) => <span className="text-sm">{formatTanggal(row.original.createdAt)}</span>,
  },
  {
    accessorKey: "lastLoginAt",
    header: "Masuk terakhir",
    meta: { hideOnMobile: true },
    sortUndefined: "last",
    cell: ({ row }) => <span className="text-sm">{row.original.lastLoginAt ? formatTanggal(row.original.lastLoginAt) : "Belum pernah"}</span>,
  },
];

export function UserTable({ rows }: { rows: UserRow[] }) {
  return <DataTable data={rows} columns={columns} caption="Daftar pengguna" getRowId={(r) => r.id} minWidth="min-w-160" />;
}
