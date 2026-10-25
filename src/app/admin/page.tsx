import { Banknote, ClipboardCheck, UserRoundPlus, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ChartFigure } from "@/components/charts/chart-figure";
import { MonthlyChart } from "@/components/charts/charts";
import { DashboardHeading, DashboardSection, DashboardSkeleton, StatRow } from "@/components/shared/dashboard-parts";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { adminPage } from "@/features/admin/guard";
import { getAdminDashboard } from "@/features/admin/queries";
import { formatRupiah, formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard admin", robots: { index: false } };

const nf = new Intl.NumberFormat("id-ID");

const activityIcon: Record<"transaksi" | "pengguna" | "tryout", { icon: LucideIcon; label: string }> = {
  transaksi: { icon: Banknote, label: "Transaksi" },
  pengguna: { icon: UserRoundPlus, label: "Pendaftaran" },
  tryout: { icon: ClipboardCheck, label: "Tryout" },
};

/** Daftar peringkat bernomor: lebih padat dan mudah dibandingkan daripada kartu. */
function RankList({ items, unit, empty }: { items: { id: string; label: string; sub?: string; value: number }[]; unit: string; empty: string }) {
  if (items.length === 0) return <p className="text-muted-foreground">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className="flex flex-col gap-3">
      {items.map((it, i) => (
        <li key={it.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)_7rem] items-baseline gap-x-3">
          <span className="text-sm font-bold text-muted-foreground tabular-nums">{i + 1}.</span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{it.label}</span>
            {it.sub && <span className="block text-sm text-muted-foreground">{it.sub}</span>}
            <span aria-hidden="true" className="mt-1.5 block h-1.5 rounded-full bg-secondary">
              <span className="block h-full rounded-full bg-leaf" style={{ width: `${(it.value / max) * 100}%` }} />
            </span>
          </span>
          <span className="text-right text-sm font-semibold tabular-nums">
            {nf.format(it.value)} {unit}
          </span>
        </li>
      ))}
    </ol>
  );
}

async function Content() {
  await adminPage("/admin");
  const d = await getAdminDashboard();
  return (
    <>
      <DashboardHeading title="Dashboard admin">Ringkasan pengguna, penjualan, dan aktivitas belajar di Taman Pelajar.</DashboardHeading>

      {/* M.2.1, M.2.2 */}
      <StatRow
        items={[
          { label: "Total siswa", value: nf.format(d.totalUsers), hint: `${nf.format(d.newUsers)} baru dalam 30 hari` },
          { label: "Transaksi berhasil", value: nf.format(d.paidOrders) },
          { label: "Total pendapatan", value: formatRupiah(d.revenue) },
          {
            label: "Menunggu pembayaran",
            value: nf.format(d.pendingOrders),
            hint: d.pendingOrders > 0 ? "Lihat di menu Transaksi" : undefined,
          },
        ]}
      />

      {/* M.2.7, M.2.8 */}
      <div className="grid gap-8 xl:grid-cols-2">
        <ChartFigure
          title="Pendapatan bulanan"
          description="Total pesanan berhasil per bulan (WIB), enam bulan terakhir. rb = ribu rupiah, jt = juta rupiah."
          columns={["Bulan", "Pendapatan"]}
          rows={d.revenueByMonth.map((m) => [m.label, formatRupiah(m.value)])}
        >
          <MonthlyChart data={d.revenueByMonth} format="rupiah" name="Pendapatan" />
        </ChartFigure>
        <ChartFigure
          title="Pengguna baru"
          description="Akun siswa yang mendaftar per bulan, enam bulan terakhir."
          columns={["Bulan", "Pengguna baru"]}
          rows={d.usersByMonth.map((m) => [m.label, m.value])}
        >
          <MonthlyChart data={d.usersByMonth} format="jumlah" name="Pengguna baru" />
        </ChartFigure>
      </div>

      {/* M.2.3, M.2.4 */}
      <div className="grid gap-8 md:grid-cols-2">
        <DashboardSection title="Program terlaris">
          <RankList
            items={d.topProducts.map((p) => ({ id: p.id, label: p.name, sub: p.category.shortName, value: p.salesCount }))}
            unit="terjual"
            empty="Belum ada paket yang terjual."
          />
        </DashboardSection>
        <DashboardSection title="Tryout terpopuler">
          <RankList
            items={d.topExams.map((e) => ({ id: e.id, label: e.title, value: e.attempts }))}
            unit="percobaan"
            empty="Belum ada tryout yang dikerjakan."
          />
        </DashboardSection>
      </div>

      {/* M.2.5 */}
      <DashboardSection title="Tingkat penyelesaian kelas">
        {d.completion.length === 0 ? (
          <p className="text-muted-foreground">Belum ada kelas berisi materi.</p>
        ) : (
          <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {d.completion.map((c) => (
              <li key={c.id} className="flex flex-col gap-0.5">
                <GrowthProgress value={c.rate} label={c.title} />
                <span className="text-sm text-muted-foreground tabular-nums">
                  {c.completed} dari {c.started} siswa yang memulai sudah menyelesaikan semua materi
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      {/* M.2.6 */}
      <DashboardSection title="Aktivitas terbaru">
        {d.activity.length === 0 ? (
          <p className="text-muted-foreground">Belum ada aktivitas.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {d.activity.map((a, i) => {
              const { icon: Icon, label } = activityIcon[a.kind];
              return (
                <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2.5">
                  <Icon aria-hidden="true" className="size-4.5 shrink-0 text-primary" />
                  <span className="sr-only">{label}:</span>
                  <Link href={a.href} className="min-w-0 flex-1 hover:text-primary">
                    {a.text}
                  </Link>
                  {"amount" in a && <span className="font-semibold tabular-nums">{formatRupiah(a.amount)}</span>}
                  {"score" in a && <span className="font-semibold tabular-nums">Nilai {a.score.replace(/\./g, ",")}</span>}
                  <time dateTime={a.at.toISOString()} className="w-full text-sm text-muted-foreground sm:w-auto">
                    {formatTanggalJam(a.at)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </DashboardSection>
    </>
  );
}

// Dashboard admin (M.2).
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
