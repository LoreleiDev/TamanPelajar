import { Download } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import { Suspense } from "react";

import { DashboardHeading, DashboardSection, DashboardSkeleton, StatRow } from "@/components/shared/dashboard-parts";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/features/auth/components/native-select";
import { adminPage } from "@/features/admin/guard";
import { reportRange } from "@/features/admin/report-range";
import { getSalesReport, listReportTargets } from "@/features/admin/reports";
import { statusLabel, statusTone } from "@/features/payment/labels";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Laporan", robots: { index: false } };

const nf = new Intl.NumberFormat("id-ID");

async function Content({ searchParams }: { searchParams: PageProps<"/admin/laporan">["searchParams"] }) {
  await adminPage("/admin/laporan");
  const range = reportRange(await searchParams);
  const [r, targets] = await Promise.all([getSalesReport(range), listReportTargets()]);
  const qs = `dari=${range.from}&sampai=${range.to}`;

  return (
    <>
      <Form action="/admin/laporan" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dari" className="text-sm font-semibold">
            Dari (WIB)
          </label>
          <Input id="dari" name="dari" type="date" defaultValue={range.from} className="w-44" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sampai" className="text-sm font-semibold">
            Sampai (WIB)
          </label>
          <Input id="sampai" name="sampai" type="date" defaultValue={range.to} className="w-44" />
        </div>
        <Button type="submit">Tampilkan</Button>
      </Form>

      <StatRow
        items={[
          { label: "Pendapatan", value: formatRupiah(r.revenue), hint: r.discount ? `setelah diskon ${formatRupiah(r.discount)}` : undefined },
          { label: "Pesanan berhasil", value: nf.format(r.paidOrders) },
          { label: "Siswa baru", value: nf.format(r.newUsers) },
          { label: "Tryout selesai", value: nf.format(r.finishedTryouts) },
        ]}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <DashboardSection title="Penjualan per paket">
          {r.products.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada penjualan di rentang ini.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
              <table className="w-full min-w-120 text-left">
                <caption className="sr-only">Penjualan per paket</caption>
                <thead className="bg-secondary text-sm">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Paket</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Terjual</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Nilai sebelum diskon</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {r.products.map((p) => (
                    <tr key={p.name} className="border-t border-border">
                      <th scope="row" className="px-4 py-2.5 font-semibold">{p.name}</th>
                      <td className="px-4 py-2.5 text-right">{p.count}</td>
                      <td className="px-4 py-2.5 text-right">{formatRupiah(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardSection>
        <DashboardSection title="Pesanan per status">
          {r.statuses.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada pesanan di rentang ini.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {r.statuses.map((s) => (
                <li key={s.status} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <StatusBadge tone={statusTone[s.status]}>{statusLabel[s.status]}</StatusBadge>
                  <span className="whitespace-nowrap tabular-nums">
                    {s.count} pesanan · {formatRupiah(s.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      <DashboardSection title="Unduh laporan (CSV)">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={`/api/export/transaksi?${qs}`} download>
                <Download data-icon="inline-start" />
                Transaksi {range.from} s.d. {range.to}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/api/export/pengguna" download>
                <Download data-icon="inline-start" />
                Semua pengguna
              </a>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ReportPicker
              id="pilih-tryout"
              label="Nilai peserta tryout (L.2.9)"
              action="/api/export/nilai-tryout"
              name="tryout"
              options={targets.exams.map((e) => ({ value: e.id, label: `${e.title} (${e._count.attempts} percobaan)` }))}
            />
            <ReportPicker id="pilih-kelas" label="Progres peserta kelas" action="/api/export/progres" name="kelas" options={targets.courses.map((c) => ({ value: c.id, label: c.title }))} />
          </div>
        </div>
      </DashboardSection>
    </>
  );
}

/** Pilih tryout atau kelas lalu unduh CSV-nya (form GET, jalan tanpa JavaScript). */
function ReportPicker({ id, label, action, name, options }: { id: string; label: string; action: string; name: string; options: { value: string; label: string }[] }) {
  if (options.length === 0) return null;
  return (
    <form action={action} method="get" className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <NativeSelect id={id} name={name} defaultValue={options[0].value}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          <Download data-icon="inline-start" />
          Unduh
        </Button>
      </div>
    </form>
  );
}

// Laporan dan unduhan data (M.2, L.2.9).
export default function AdminReportsPage({ searchParams }: PageProps<"/admin/laporan">) {
  return (
    <>
      <DashboardHeading title="Laporan">Ringkasan penjualan dan aktivitas per rentang tanggal, serta unduhan data dalam CSV.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
