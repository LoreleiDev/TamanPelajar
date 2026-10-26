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
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { listAdminProducts } from "@/features/admin/products/queries";
import { programTypeLabel } from "@/features/admin/products/schemas";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Paket produk", robots: { index: false } };

const filterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]).optional().catch(undefined),
});

async function Content({ searchParams }: { searchParams: PageProps<"/admin/produk">["searchParams"] }) {
  await adminPage("/admin/produk");
  const filter = filterSchema.parse(await searchParams);
  const rows = await listAdminProducts(filter);
  return (
    <>
      <FilterBar
        action="/admin/produk"
        q={filter.q}
        searchLabel="Cari paket"
        placeholder="Nama paket"
        selects={[{ name: "status", label: "Status", value: filter.status, options: Object.entries(publishLabel).map(([value, label]) => ({ value, label })) }]}
      />
      {rows.length === 0 ? (
        <EmptyState title="Belum ada paket" description="Buat paket berisi kelas, tryout, atau video, lalu terbitkan agar bisa dibeli." />
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
          <table className="w-full min-w-176 text-left">
            <caption className="sr-only">Daftar paket</caption>
            <thead className="bg-secondary text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Paket</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Harga</th>
                <th scope="col" className="px-4 py-3 font-semibold">Isi</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Terjual</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Aktif</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <Link href={`/admin/produk/${p.id}`} className="font-semibold text-primary hover:underline">
                      {p.name}
                    </Link>
                    <span className="block text-sm text-muted-foreground">
                      {p.category.shortName} · {programTypeLabel[p.programType]} · {p.activeDays} hari
                    </span>
                  </th>
                  <td className="px-4 py-3 text-right">
                    {formatRupiah(p.promoPrice ?? p.price)}
                    {p.promoPrice !== null && <span className="block text-sm text-muted-foreground line-through">{formatRupiah(p.price)}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {p._count.courses} kelas, {p._count.exams} tryout
                    {p._count.videos > 0 && `, ${p._count.videos} video`}
                  </td>
                  <td className="px-4 py-3 text-right">{p.salesCount}</td>
                  <td className="px-4 py-3 text-right">{p._count.enrollments}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={publishTone[p.status]}>{publishLabel[p.status]}</StatusBadge>
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

// Paket produk (M.4, C.2.3).
export default function AdminProductsPage({ searchParams }: PageProps<"/admin/produk">) {
  return (
    <>
      <DashboardHeading
        title="Paket produk"
        action={
          <Button asChild>
            <Link href="/admin/produk/baru">
              <Plus data-icon="inline-start" />
              Buat paket
            </Link>
          </Button>
        }
      >
        Paket yang dijual: harga, masa aktif, serta kelas dan tryout yang termasuk. Kolom Aktif menunjukkan siswa yang masa aktifnya masih berjalan.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
