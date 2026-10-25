"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DataTable } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { aturStatusSoal, hapusSoal } from "@/features/admin/questions/actions";
import { difficultyLabel, questionTypeLabel, type QuestionTypeCode } from "@/features/admin/questions/schemas";

export interface QuestionRow {
  id: string;
  excerpt: string;
  subject: string;
  topic: string;
  type: QuestionTypeCode;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  status: "DRAF" | "TERBIT" | "ARSIP";
  category: string;
  author: string;
  usedIn: number;
}

const columns: ColumnDef<QuestionRow, unknown>[] = [
  {
    accessorKey: "excerpt",
    header: "Soal",
    meta: { rowHeader: true },
    cell: ({ row }) => (
      <>
        <Link href={`/admin/bank-soal/${row.original.id}`} className="line-clamp-2 max-w-[48ch] font-semibold text-primary hover:underline">
          {row.original.excerpt}
        </Link>
        <span className="block text-sm text-muted-foreground">
          {row.original.category} · {row.original.subject} · {row.original.topic}
        </span>
      </>
    ),
  },
  { accessorKey: "type", header: "Jenis", meta: { hideOnMobile: true }, cell: ({ row }) => <span className="text-sm">{questionTypeLabel[row.original.type]}</span> },
  { accessorKey: "difficulty", header: "Kesulitan", meta: { hideOnMobile: true }, cell: ({ row }) => difficultyLabel[row.original.difficulty] },
  { accessorKey: "usedIn", header: "Dipakai", meta: { numeric: true }, cell: ({ row }) => `${row.original.usedIn} tryout` },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge tone={publishTone[row.original.status]}>{publishLabel[row.original.status]}</StatusBadge>,
  },
  { accessorKey: "author", header: "Pembuat", meta: { hideOnMobile: true }, cell: ({ row }) => <span className="text-sm">{row.original.author}</span> },
];

/** Tabel bank soal dengan terbit dan hapus massal (M.5.7, M.5.8). */
export function QuestionTable({ rows }: { rows: QuestionRow[] }) {
  const router = useRouter();
  return (
    <DataTable
      data={rows}
      columns={columns}
      caption="Bank soal"
      getRowId={(r) => r.id}
      minWidth="min-w-176"
      bulkActions={(ids, clear) => (
        <>
          <Button
            size="sm"
            onClick={async () => {
              const r = await aturStatusSoal({ ids, status: "TERBIT" });
              if (!r.ok) return void toast.error(r.error);
              toast.success(`${r.data.count} soal diterbitkan.`);
              clear();
              router.refresh();
            }}
          >
            Terbitkan
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const r = await aturStatusSoal({ ids, status: "DRAF" });
              if (!r.ok) return void toast.error(r.error);
              toast.success(`${r.data.count} soal dijadikan draf.`);
              clear();
              router.refresh();
            }}
          >
            Jadikan draf
          </Button>
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                Hapus
              </Button>
            }
            title={`Hapus ${ids.length} soal?`}
            description="Soal yang sudah dipakai tryout dilewati agar nilai siswa tetap utuh. Soal lainnya disembunyikan dari bank soal."
            confirmLabel="Hapus soal"
            destructive
            onConfirm={async () => {
              const r = await hapusSoal({ ids });
              if (!r.ok) return void toast.error(r.error);
              toast.success(r.data.skipped ? `${r.data.deleted} soal dihapus, ${r.data.skipped} dilewati karena dipakai tryout.` : `${r.data.deleted} soal dihapus.`);
              clear();
              router.refresh();
            }}
          />
        </>
      )}
    />
  );
}
