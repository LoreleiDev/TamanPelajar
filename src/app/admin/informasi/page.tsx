import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { listAdminArticles } from "@/features/article/queries";
import { articleCategoryLabel } from "@/features/article/schemas";
import { formatTanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Informasi", robots: { index: false } };

async function Content() {
  await adminPage("/admin/informasi");
  const rows = await listAdminArticles();
  if (rows.length === 0) return <EmptyState title="Belum ada artikel" description="Tulis artikel, jadwal ujian, pengumuman, atau tips belajar untuk halaman Informasi." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
      <table className="w-full min-w-160 text-left">
        <caption className="sr-only">Daftar artikel</caption>
        <thead className="bg-secondary text-sm">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Judul</th>
            <th scope="col" className="px-4 py-3 font-semibold">Kategori</th>
            <th scope="col" className="px-4 py-3 font-semibold">Terbit</th>
            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-border align-top">
              <th scope="row" className="px-4 py-3 font-normal">
                <Link href={`/admin/informasi/${a.id}`} className="font-semibold text-primary hover:underline">
                  {a.title}
                </Link>
                <span className="block text-sm text-muted-foreground">oleh {a.author.name}</span>
              </th>
              <td className="px-4 py-3">{articleCategoryLabel[a.category]}</td>
              <td className="px-4 py-3 text-sm">{a.publishedAt ? formatTanggal(a.publishedAt) : "–"}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={publishTone[a.status]}>{publishLabel[a.status]}</StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Informasi dan artikel (C.2.8, D.4).
export default function AdminArticlesPage() {
  return (
    <>
      <DashboardHeading
        title="Informasi"
        action={
          <Button asChild>
            <Link href="/admin/informasi/baru">
              <Plus data-icon="inline-start" />
              Tulis artikel
            </Link>
          </Button>
        }
      >
        Artikel pendidikan, jadwal ujian, pengumuman, tips belajar, dan informasi pendaftaran.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
