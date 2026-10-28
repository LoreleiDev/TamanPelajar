import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { BulkSelection, RowCheckbox, SelectAllCheckbox } from "@/components/admin/bulk-selection";
import { FilterBar, pageHref } from "@/components/admin/filter-bar";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getExamCategories } from "@/features/admin/exams/queries";
import { hapusVideoMassal } from "@/features/admin/bulk-actions";
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { listAdminVideos } from "@/features/admin/videos";
import { formatClock } from "@/lib/format";

export const metadata: Metadata = { title: "Video", robots: { index: false } };

const filterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().trim().max(60).optional().catch(undefined),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

const providerLabel = { YOUTUBE: "YouTube", VIMEO: "Vimeo", EKSTERNAL: "Eksternal" } as const;

async function Content({ searchParams }: { searchParams: PageProps<"/admin/video">["searchParams"] }) {
  await adminPage("/admin/video");
  const filter = filterSchema.parse(await searchParams);
  const [data, categories] = await Promise.all([listAdminVideos(filter), getExamCategories()]);
  return (
    <>
      <FilterBar
        action="/admin/video"
        q={filter.q}
        searchLabel="Cari video"
        placeholder="Judul atau mata pelajaran"
        selects={[
          { name: "category", label: "Program", value: filter.category, options: categories.map((c) => ({ value: c.slug, label: c.name })) },
          { name: "status", label: "Status", value: filter.status, options: Object.entries(publishLabel).map(([value, label]) => ({ value, label })) },
        ]}
      />
      <p className="text-sm text-muted-foreground tabular-nums">{data.total} video</p>
      {data.rows.length === 0 ? (
        <EmptyState title="Tidak ada video yang cocok" description="Ubah filter atau tambahkan video baru dari URL YouTube, Vimeo, atau berkas eksternal." />
      ) : (
        <BulkSelection ids={data.rows.map((r) => r.id)} noun="video" action={hapusVideoMassal}>
          <div className="relative overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
            <table className="w-full min-w-176 text-left">
              <caption className="sr-only">Daftar video</caption>
              <thead className="bg-secondary text-sm">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3">
                    <SelectAllCheckbox label="Pilih semua video" />
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">Video</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Sumber</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Durasi</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Di kelas</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Penonton</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data.rows.map((v) => (
                  <tr key={v.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <RowCheckbox id={v.id} label={v.title} />
                    </td>
                    <th scope="row" className="px-4 py-3 font-normal">
                      <Link href={`/admin/video/${v.id}`} className="font-semibold text-primary hover:underline">
                        {v.title}
                      </Link>
                      <span className="block text-sm text-muted-foreground">
                        {v.category.shortName} · {v.subject}
                      </span>
                    </th>
                    <td className="px-4 py-3">{providerLabel[v.provider]}</td>
                    <td className="px-4 py-3 text-right">{formatClock(v.durationSec)}</td>
                    <td className="px-4 py-3 text-right">{v._count.lessons}</td>
                    <td className="px-4 py-3 text-right">{v._count.progress}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={publishTone[v.status]}>{publishLabel[v.status]}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkSelection>
      )}
      <DataPagination page={data.page} pageCount={data.pageCount} hrefFor={(p) => pageHref("/admin/video", filter, p)} />
    </>
  );
}

// Pustaka video admin (L.2.4).
export default function AdminVideosPage({ searchParams }: PageProps<"/admin/video">) {
  return (
    <>
      <DashboardHeading
        title="Video"
        action={
          <Button asChild>
            <Link href="/admin/video/baru">
              <Plus data-icon="inline-start" />
              Tambah video
            </Link>
          </Button>
        }
      >
        Video pustaka dari URL YouTube, Vimeo, atau berkas eksternal. Video yang sama bisa dipakai di materi kelas.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
