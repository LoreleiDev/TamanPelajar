import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ChartFigure } from "@/components/charts/chart-figure";
import { CompareChart, TopicMasteryChart } from "@/components/charts/lazy";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  getComparison,
  getCourseProgress,
  getDifficultyBreakdown,
  getRecommendations,
  getResults,
  getTopicMastery,
} from "@/features/dashboard/queries";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Analisis kemampuan", robots: { index: false } };
const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const difficultyLabel = { MUDAH: "Mudah", SEDANG: "Sedang", SULIT: "Sulit" } as const;

async function Content() {
  const user = await requireUserPage("/dashboard/analisis");
  const [topics, comparison, difficulty, results, courses] = await Promise.all([
    getTopicMastery(user.id),
    getComparison(user.id),
    getDifficultyBreakdown(user.id),
    getResults(user.id),
    getCourseProgress(user.id),
  ]);
  const recommendations = await getRecommendations(user.id, topics, courses);

  if (results.length === 0) {
    return (
      <>
        <DashboardHeading title="Analisis kemampuan" />
        <EmptyState
          title="Analisis muncul setelah tryout pertama"
          description="Kerjakan satu tryout untuk melihat penguasaan topik, akurasi, dan rekomendasi belajar."
          action={
            <Button asChild>
              <Link href="/dashboard/tryout">Lihat tryout saya</Link>
            </Button>
          }
        />
      </>
    );
  }

  // Perbandingan antarpercobaan per tryout (J.2.6).
  const byExam = new Map<string, typeof results>();
  for (const r of [...results].reverse()) byExam.set(r.examTitle, [...(byExam.get(r.examTitle) ?? []), r]);

  return (
    <>
      <DashboardHeading title="Analisis kemampuan">Dihitung dari semua tryout yang sudah kamu kumpulkan.</DashboardHeading>

      <div className="grid gap-8 xl:grid-cols-2">
        <ChartFigure
          title="Penguasaan topik"
          description="Topik dengan penguasaan di bawah 70% sebaiknya diulang."
          columns={["Topik", "Mata pelajaran", "Benar", "Penguasaan (%)", "Rata-rata waktu (detik)"]}
          rows={topics.map((t) => [t.topic, t.subject, `${t.correct}/${t.total}`, t.mastery, t.avgTimeSec])}
        >
          <TopicMasteryChart data={topics.map((t) => ({ topic: t.topic, mastery: t.mastery }))} />
        </ChartFigure>
        <ChartFigure
          title="Dibanding rata-rata peserta"
          columns={["Tryout", "Nilaimu (%)", "Rata-rata (%)", "Peserta"]}
          rows={comparison.map((c) => [c.exam, num.format(c.mine), num.format(c.average), c.participants])}
        >
          <CompareChart data={comparison.map((c) => ({ exam: c.exam.replace("Tryout ", ""), mine: c.mine, average: c.average }))} />
        </ChartFigure>
      </div>

      {/* Akurasi dan kecepatan per tingkat kesulitan (J.2.3–J.2.5) */}
      <DashboardSection title="Akurasi per tingkat kesulitan">
        <div className="relative overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
          <table className="w-full min-w-md text-left tabular-nums">
            <caption className="sr-only">Akurasi per tingkat kesulitan</caption>
            <thead className="bg-secondary text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Tingkat</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Benar</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Akurasi</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Waktu per soal</th>
              </tr>
            </thead>
            <tbody>
              {difficulty.map((d) => (
                <tr key={d.difficulty} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                  <th scope="row" className="px-4 py-3 font-semibold">{difficultyLabel[d.difficulty]}</th>
                  <td className="px-4 py-3 text-right">
                    {d.correct}/{d.total}
                  </td>
                  <td className="px-4 py-3 text-right">{d.accuracy !== null ? `${d.accuracy}%` : "–"}</td>
                  <td className="px-4 py-3 text-right">{d.avgTimeSec !== null ? `${d.avgTimeSec} detik` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      {/* Perbandingan antarpercobaan (J.2.6) */}
      <DashboardSection title="Perkembangan antarpercobaan">
        <ul className="flex flex-col gap-2">
          {[...byExam].map(([exam, attempts]) => (
            <li key={exam} className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-border px-4 py-3">
              <span className="font-semibold">{exam}</span>
              <span className="text-sm tabular-nums">
                {attempts.map((a) => `${num.format(a.percent)}%`).join(" → ")}
                {attempts.length > 1 &&
                  (() => {
                    const diff = attempts.at(-1)!.percent - attempts[0].percent;
                    if (diff === 0) return <span className="ml-2 text-muted-foreground">(tetap)</span>;
                    return (
                      <span className={diff > 0 ? "ml-2 font-semibold text-success" : "ml-2 font-semibold text-destructive"}>
                        ({diff > 0 ? "naik" : "turun"} {num.format(Math.abs(diff))} poin)
                      </span>
                    );
                  })()}
              </span>
            </li>
          ))}
        </ul>
      </DashboardSection>

      {/* Rekomendasi otomatis (J.2.8) */}
      <DashboardSection title="Rekomendasi belajar">
        {recommendations.length === 0 ? (
          <p className="text-muted-foreground">Semua topik sudah di atas 70%. Pertahankan dengan tryout berikutnya.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recommendations.map((r) => (
              <li key={r.topic} className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-accent px-4 py-3">
                <span>
                  Ulangi topik <strong>{r.topic}</strong> <span className="text-muted-foreground tabular-nums">(penguasaan {r.mastery}%)</span>
                </span>
                {r.course && (
                  <Link
                    href={r.nextLesson ? `/kelas/${r.course.slug}/${r.nextLesson.slug}` : `/kelas/${r.course.slug}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Buka {r.course.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </>
  );
}

// Analisis Kemampuan (F.1, F.3.2, F.3.4, J.2).
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
