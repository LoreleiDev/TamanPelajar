import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { FilterBar } from "@/components/admin/filter-bar";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { listAdminCourses } from "@/features/admin/courses/queries";
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { formatStudyTime } from "@/lib/format";

export const metadata: Metadata = { title: "Kelas", robots: { index: false } };

const filterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]).optional().catch(undefined),
});

async function Content({ searchParams }: { searchParams: PageProps<"/admin/kelas">["searchParams"] }) {
  await adminPage("/admin/kelas");
  const filter = filterSchema.parse(await searchParams);
  const rows = await listAdminCourses(filter);
  return (
    <>
      <FilterBar
        action="/admin/kelas"
        q={filter.q}
        searchLabel="Cari kelas"
        placeholder="Judul atau mata pelajaran"
        selects={[{ name: "status", label: "Status", value: filter.status, options: Object.entries(publishLabel).map(([value, label]) => ({ value, label })) }]}
      />
      {rows.length === 0 ? (
        <EmptyState title="Belum ada kelas" description="Buat kelas, lalu susun bab dan materinya." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
          <table className="w-full min-w-176 text-left">
            <caption className="sr-only">Daftar kelas</caption>
            <thead className="bg-secondary text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Kelas</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Bab</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Materi</th>
                <th scope="col" className="px-4 py-3 font-semibold">Durasi</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Di paket</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <Link href={`/admin/kelas/${c.id}`} className="font-semibold text-primary hover:underline">
                      {c.title}
                    </Link>
                    <span className="block text-sm text-muted-foreground">
                      {c.category} · {c.subject}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-right">
                    {c.sectionCount}
                    <span className="block text-sm text-muted-foreground">{c.freeSections} gratis</span>
                  </td>
                  <td className="px-4 py-3 text-right">{c.lessonCount}</td>
                  <td className="px-4 py-3">{formatStudyTime(c.estimatedMinutes * 60)}</td>
                  <td className="px-4 py-3 text-right">{c.products}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={publishTone[c.status]}>{publishLabel[c.status]}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Kelola kelas (L.1, L.2.1, C.2.2–C.2.3).
export default function AdminCoursesPage({ searchParams }: PageProps<"/admin/kelas">) {
  return (
    <>
      <DashboardHeading
        title="Kelas"
        action={
          <Button asChild>
            <Link href="/admin/kelas/baru">
              <Plus data-icon="inline-start" />
              Buat kelas
            </Link>
          </Button>
        }
      >
        Susun bab dan materi, tandai bab gratis, unggah PDF, dan pantau progres peserta.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
