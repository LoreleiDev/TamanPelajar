import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DashboardHeading, DashboardSkeleton, StatRow } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Breadcrumb } from "@/components/shared/page-header";
import { PassStatus } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getExamResults } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";
import { attemptLabel } from "@/features/admin/labels";
import { formatClock, formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Hasil peserta", robots: { index: false } };

const num = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

async function Content({ params }: { params: PageProps<"/admin/tryout/[id]/hasil">["params"] }) {
  const { id } = await params;
  await adminPage(`/admin/tryout/${id}/hasil`);
  const data = await getExamResults(id);
  if (!data) notFound();
  const { exam, attempts } = data;
  const done = attempts.filter((a) => a.result);
  const avg = done.length ? done.reduce((n, a) => n + a.result!.totalScore, 0) / done.length : 0;
  const passed = done.filter((a) => a.result!.passed).length;
  const participants = new Set(attempts.map((a) => a.user.id)).size;

  return (
    <>
      <Breadcrumb items={[{ label: "Tryout", href: "/admin/tryout" }, { label: exam.title, href: `/admin/tryout/${exam.id}` }, { label: "Hasil" }]} />
      <DashboardHeading
        title={`Hasil ${exam.title}`}
        action={
          <Button asChild variant="outline">
            <a href={`/api/export/nilai/${exam.id}`} download>
              <Download data-icon="inline-start" />
              Unduh nilai (CSV)
            </a>
          </Button>
        }
      >
        Semua percobaan peserta. Buka nama tryout di baris untuk melihat hasil lengkap.
      </DashboardHeading>
      <StatRow
        items={[
          { label: "Peserta", value: participants },
          { label: "Percobaan selesai", value: done.length },
          { label: "Rata-rata nilai", value: num(avg) },
          { label: "Lulus", value: `${passed}/${done.length}` },
        ]}
      />
      {attempts.length === 0 ? (
        <EmptyState title="Belum ada peserta" description="Hasil muncul di sini setelah siswa mengerjakan tryout ini." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-208 text-left">
            <caption className="sr-only">Hasil peserta {exam.title}</caption>
            <thead className="bg-secondary text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Peserta</th>
                <th scope="col" className="px-4 py-3 font-semibold">Percobaan</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Nilai</th>
                {exam.sections.map((s) => (
                  <th key={s.id} scope="col" className="px-4 py-3 text-right font-semibold">
                    {s.title}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right font-semibold">B/S/K</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Waktu</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Dikumpulkan</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {attempts.map((a) => {
                const bySection = new Map(a.result?.sections.map((s) => [s.sectionId, s.score]));
                return (
                  <tr key={a.id} className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-3 font-normal">
                      <Link href={`/admin/pengguna/${a.user.id}`} className="font-semibold hover:text-primary">
                        {a.user.name}
                      </Link>
                      <span className="block text-sm break-all text-muted-foreground">{a.user.email}</span>
                    </th>
                    <td className="px-4 py-3">
                      {a.result ? (
                        <Link href={`/tryout/hasil/${a.id}`} className="text-primary hover:underline">
                          ke-{a.attemptNo}
                        </Link>
                      ) : (
                        `ke-${a.attemptNo}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{a.result ? `${num(a.result.totalScore)} / ${num(a.result.maxScore)}` : "–"}</td>
                    {exam.sections.map((s) => (
                      <td key={s.id} className="px-4 py-3 text-right">
                        {bySection.has(s.id) ? num(bySection.get(s.id)!) : "–"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">{a.result ? `${a.result.correct}/${a.result.wrong}/${a.result.empty}` : "–"}</td>
                    <td className="px-4 py-3 text-right">{a.result ? formatClock(a.result.durationSec) : "–"}</td>
                    <td className="px-4 py-3">
                      {a.result ? <PassStatus passed={a.result.passed} /> : attemptLabel[a.status]}
                      {a.pendingEssays > 0 && (
                        <Link href="/admin/penilaian" className="block text-sm font-semibold text-warning hover:underline">
                          {a.pendingEssays} essay belum dinilai
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{a.submittedAt ? formatTanggalJam(a.submittedAt) : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Hasil peserta tryout (C.2.5, L.2.9).
export default function ExamResultsPage({ params }: PageProps<"/admin/tryout/[id]/hasil">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
