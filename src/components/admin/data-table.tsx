"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Rata kanan untuk angka dan uang. */
    numeric?: boolean;
    /** Sembunyikan kolom di layar kecil. */
    hideOnMobile?: boolean;
    /** Sel pertama sebagai header baris (th scope=row). */
    rowHeader?: boolean;
  }
}

/**
 * Tabel admin (TanStack Table): urut per kolom di halaman aktif, seleksi untuk aksi massal.
 * Pagination, pencarian, dan filter berjalan di server lewat parameter URL.
 */
export function DataTable<T>({
  data,
  columns,
  caption,
  getRowId,
  bulkActions,
  minWidth = "min-w-176",
  empty,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  caption: string;
  getRowId: (row: T) => string;
  /** Bila diisi, tabel memiliki kolom centang dan bilah aksi massal. */
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  minWidth?: string;
  empty?: ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectColumn: ColumnDef<T, unknown> = {
    id: "_pilih",
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Pilih semua baris di halaman ini"
        checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? "indeterminate" : false}
        onCheckedChange={(v) => table.toggleAllRowsSelected(v === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox aria-label="Pilih baris ini" checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(v === true)} />
    ),
  };

  // TanStack Table belum cocok dengan React Compiler; komponen ini dilewati compiler.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: bulkActions ? [selectColumn, ...columns] : columns,
    state: { sorting, rowSelection },
    getRowId: (row) => getRowId(row),
    enableRowSelection: Boolean(bulkActions),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  if (data.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="flex flex-col gap-3">
      {bulkActions && selectedIds.length > 0 && (
        <div role="region" aria-label="Aksi massal" className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-accent px-4 py-2.5">
          <span className="font-semibold tabular-nums">{selectedIds.length} dipilih</span>
          <div className="flex flex-wrap gap-2">{bulkActions(selectedIds, () => setRowSelection({}))}</div>
          <button type="button" onClick={() => setRowSelection({})} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            Batalkan pilihan
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
        <table className={cn("w-full text-left", minWidth)}>
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-secondary text-sm">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta;
                  const sorted = h.column.getIsSorted();
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                      className={cn(
                        "px-4 py-3 font-semibold whitespace-nowrap",
                        h.column.id === "_pilih" && "w-10 pr-0",
                        meta?.numeric && "text-right",
                        meta?.hideOnMobile && "hidden md:table-cell",
                      )}
                    >
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className={cn("inline-flex items-center gap-1 hover:text-primary", meta?.numeric && "flex-row-reverse")}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp aria-hidden="true" className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown aria-hidden="true" className="size-3.5" />
                          ) : (
                            <ArrowUpDown aria-hidden="true" className="size-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="tabular-nums">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} data-state={row.getIsSelected() ? "selected" : undefined} className="border-t border-border align-top data-[state=selected]:bg-accent/50">
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  const cls = cn(
                    "px-4 py-3",
                    cell.column.id === "_pilih" && "pr-0",
                    meta?.numeric && "text-right",
                    meta?.hideOnMobile && "hidden md:table-cell",
                  );
                  return meta?.rowHeader ? (
                    <th key={cell.id} scope="row" className={cn(cls, "font-normal")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </th>
                  ) : (
                    <td key={cell.id} className={cls}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
