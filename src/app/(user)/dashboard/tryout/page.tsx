import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getMyExams } from "@/features/dashboard/queries";
import { formatTanggalJam } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Tryout saya", robots: { index: false } };
const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

async function Content() {
  const user = await requireUserPage("/dashboard/tryout");
  const exams = await getMyExams(user.id);
  return (
    <>
      <DashboardHeading title="Tryout saya">Tryout dari paket aktifmu, dengan jumlah percobaan dan nilai tertinggi.</DashboardHeading>
      {exams.length === 0 ? (
        <EmptyState
          title="Belum ada tryout"
          description="Tryout tersedia setelah kamu membeli paket yang berisi tryout."
          action={
            <Button asChild>
              <Link href="/program?jenis=TRYOUT">Lihat paket tryout</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
          <table className="w-full min-w-2xl text-left">
            <caption className="sr-only">Daftar tryout</caption>
            <thead className="bg-secondary text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Tryout</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Soal</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Durasi</th>
                <th scope="col" className="px-4 py-3 font-semibold">Jadwal</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Percobaan</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Nilai tertinggi</th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {exams.map((e) => (
                <tr key={e.slug} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                  <th scope="row" className="px-4 py-3 font-semibold">{e.title}</th>
                  <td className="px-4 py-3 text-right">{e.questionCount}</td>
                  <td className="px-4 py-3 text-right">{e.durationMin} menit</td>
                  <td className="px-4 py-3 text-sm">{e.closesAt ? `Sampai ${formatTanggalJam(e.closesAt)}` : "Kapan saja"}</td>
                  <td className="px-4 py-3 text-right">
                    {e.attemptsUsed}/{e.maxAttempts}
                  </td>
                  <td className="px-4 py-3">{e.status}</td>
                  <td className="px-4 py-3 text-right">{e.bestPercent !== null ? `${num.format(e.bestPercent)}%` : "–"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/tryout/${e.slug}`} className="font-semibold text-primary hover:underline">
                      {e.status === "Sedang dikerjakan" ? "Lanjutkan" : "Kerjakan"}
                      <span className="sr-only"> {e.title}</span>
                    </Link>
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

// Tryout Saya (F.1, I.1).
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
