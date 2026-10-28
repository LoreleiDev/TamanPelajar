import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BulkSelection, RowCheckbox, SelectAllCheckbox } from "@/components/admin/bulk-selection";
import { FilterBar } from "@/components/admin/filter-bar";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { examFilterSchema } from "@/features/admin/exams/schemas";
import { listAdminExams } from "@/features/admin/exams/queries";
import { hapusTryoutMassal } from "@/features/admin/bulk-actions";
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Tryout", robots: { index: false } };

async function Content({ searchParams }: { searchParams: PageProps<"/admin/tryout">["searchParams"] }) {
  await adminPage("/admin/tryout");
  const filter = examFilterSchema.parse(await searchParams);
  const rows = await listAdminExams(filter);
  return (
    <>
      <FilterBar
        action="/admin/tryout"
        q={filter.q}
        searchLabel="Cari tryout"
        placeholder="Nama tryout"
        selects={[{ name: "status", label: "Status", value: filter.status, options: Object.entries(publishLabel).map(([value, label]) => ({ value, label })) }]}
      />
      {rows.length === 0 ? (
        <EmptyState title="Belum ada tryout" description="Buat tryout, tambahkan subtes, lalu pilih soal dari bank soal." />
      ) : (
        <BulkSelection ids={rows.map((r) => r.id)} noun="tryout" action={hapusTryoutMassal}>
          <div className="relative overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
            <table className="w-full min-w-176 text-left">
              <caption className="sr-only">Daftar tryout</caption>
              <thead className="bg-secondary text-sm">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3">
                    <SelectAllCheckbox label="Pilih semua tryout" />
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tryout</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Subtes</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Soal</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Durasi</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Percobaan</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Jadwal</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.map((e) => (
                  <tr key={e.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <RowCheckbox id={e.id} label={e.title} />
                    </td>
                    <th scope="row" className="px-4 py-3 font-normal">
                      <Link href={`/admin/tryout/${e.id}`} className="font-semibold text-primary hover:underline">
                        {e.title}
                      </Link>
                      <span className="block text-sm text-muted-foreground">{e.category}</span>
                    </th>
                    <td className="px-4 py-3 text-right">{e.sections}</td>
                    <td className="px-4 py-3 text-right">{e.questions}</td>
                    <td className="px-4 py-3 text-right">{e.durationMin} menit</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/tryout/${e.id}/hasil`} className="hover:text-primary">
                        {e.attempts}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {e.opensAt || e.closesAt ? (
                        <>
                          {e.opensAt ? formatTanggalJam(e.opensAt) : "Sekarang"}
                          <span className="block text-muted-foreground">s.d. {e.closesAt ? formatTanggalJam(e.closesAt) : "tanpa batas"}</span>
                        </>
                      ) : (
                        "Selalu terbuka"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={publishTone[e.status]}>{publishLabel[e.status]}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkSelection>
      )}
    </>
  );
}

// Manajemen tryout (M.6, C.2.4).
export default function AdminExamsPage({ searchParams }: PageProps<"/admin/tryout">) {
  return (
    <>
      <DashboardHeading
        title="Tryout"
        action={
          <Button asChild>
            <Link href="/admin/tryout/baru">
              <Plus data-icon="inline-start" />
              Buat tryout
            </Link>
          </Button>
        }
      >
        Pengaturan, subtes, soal, pratinjau, dan hasil peserta setiap tryout.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
