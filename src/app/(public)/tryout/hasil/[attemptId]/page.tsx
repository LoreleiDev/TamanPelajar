import { BookOpen, CircleCheck, History, ListChecks, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { ChartFigure } from "@/components/charts/chart-figure";
import { TopicCompareChart, TopicRadarChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { PassStatus } from "@/components/shared/status-badge";
import { getAttemptResult, type AttemptResult } from "@/features/exam/results";
import { formatClock, formatTanggalJam } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Hasil tryout", robots: { index: false } };

const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const difficultyLabel = { MUDAH: "Mudah", SEDANG: "Sedang", SULIT: "Sulit" } as const;

function Actions({ r }: { r: AttemptResult }) {
  return (
    <div className="flex flex-wrap gap-3">
      {r.discussion.open ? (
        <Button asChild size="lg">
          <Link href={`/tryout/pembahasan/${r.attemptId}`}>
            <ListChecks aria-hidden="true" data-icon="inline-start" />
            Lihat pembahasan
          </Link>
        </Button>
      ) : (
        <p className="self-center rounded-lg bg-secondary px-4 py-2.5 text-sm">
          {r.discussion.opensAt ? `Pembahasan dibuka ${formatTanggalJam(r.discussion.opensAt)}.` : "Pembahasan tryout ini tidak ditampilkan."}
        </p>
      )}
      {r.canRetry && (
        <Button asChild size="lg" variant="outline">
          <Link href={`/tryout/${r.exam.slug}`}>
            <RotateCcw aria-hidden="true" data-icon="inline-start" />
            Ulangi tryout
          </Link>
        </Button>
      )}
      <Button asChild size="lg" variant="ghost">
        <Link href="/dashboard/riwayat">
          <History aria-hidden="true" data-icon="inline-start" />
          Riwayat hasil
        </Link>
      </Button>
    </div>
  );
}

async function Content({ params }: { params: PageProps<"/tryout/hasil/[attemptId]">["params"] }) {
  const { attemptId } = await params;
  const user = await requireUserPage(`/tryout/hasil/${attemptId}`);
  const r = await getAttemptResult(attemptId, user);
  if (r.kind === "tidak-ada") notFound();
  if (r.kind === "berlangsung") redirect(`/ujian/${attemptId}`);

  const t = r.total;
  const radar = r.topics.length >= 3;
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Tryout", href: "/tryout" }, { label: r.exam.title, href: `/tryout/${r.exam.slug}` }, { label: "Hasil" }]}
        title={`Hasil ${r.exam.title}`}
        meta={
          <span className="tabular-nums">
            Percobaan ke-{r.attemptNo}
            {r.attemptsUsed !== null && ` dari ${r.exam.maxAttempts}`}, dikumpulkan {formatTanggalJam(r.submittedAt)}
          </span>
        }
      />
      <div className="page-container flex flex-col gap-10 py-10 md:py-12">

      {/* Ringkasan nilai (I.6.1–I.6.6) */}
      <section aria-labelledby="ringkasan-judul" className="grid gap-6 rounded-xl bg-secondary p-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10 md:p-7">
        <h2 id="ringkasan-judul" className="sr-only">
          Ringkasan nilai
        </h2>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Nilai akhir</p>
          <p className="text-display leading-none font-extrabold tabular-nums">
            {num.format(t.totalScore)}
            <span className="text-2xl font-bold text-muted-foreground">/{num.format(t.maxScore)}</span>
          </p>
          <p className="text-lg tabular-nums">
            {num.format(t.percent)}% · nilai lulus {num.format(r.exam.passingGrade)}
          </p>
          <PassStatus passed={t.passed} className="text-xl" />
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 self-center sm:grid-cols-3">
          {[
            ["Peringkat", `${r.ranking.rank} dari ${r.ranking.participants}`],
            ["Persentil", `${r.ranking.percentile}`],
            ["Rata-rata peserta", `${num.format(r.ranking.average)} (${num.format(r.ranking.averagePercent)}%)`],
            ["Benar · salah · kosong", `${t.correct} · ${t.wrong} · ${t.empty}`],
            ["Waktu pengerjaan", formatClock(t.durationSec)],
            ["Rata-rata per soal", `${r.avgTimePerQuestionSec} detik`],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="text-lg font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        {t.pending > 0 && (
          <p className="text-sm md:col-span-2" role="note">
            {t.pending} jawaban essay masih menunggu penilaian admin. Nilai akhir bisa naik setelah dinilai.
          </p>
        )}
      </section>

      <Actions r={r} />

      <section aria-labelledby="subtes-judul" className="flex flex-col gap-3">
        <h2 id="subtes-judul" className="text-heading">
          Nilai per subtes
        </h2>
        <div className="relative overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
          <table className="w-full min-w-xl text-left">
            <caption className="sr-only">Nilai per subtes</caption>
            <thead className="bg-secondary text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Subtes</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Benar</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Salah</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Kosong</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Nilai</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Ambang</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {r.sections.map((s) => (
                <tr key={s.id} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                  <th scope="row" className="px-4 py-3 font-semibold">{s.title}</th>
                  <td className="px-4 py-3 text-right">{s.correct}</td>
                  <td className="px-4 py-3 text-right">{s.wrong}</td>
                  <td className="px-4 py-3 text-right">{s.empty}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {num.format(s.score)}/{num.format(s.maxScore)}
                  </td>
                  <td className="px-4 py-3 text-right">{s.passingGrade !== null ? num.format(s.passingGrade) : "–"}</td>
                  <td className="px-4 py-3">
                    <PassStatus passed={s.passed} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grafik kemampuan (I.6.7–I.6.8, J.2.1–J.2.2, J.2.7) */}
      <div className={`grid gap-10 ${radar ? "lg:grid-cols-2" : ""}`}>
        {radar && (
          <ChartFigure
            title="Radar kemampuan"
            description="Persentase jawaban benar di setiap topik pada percobaan ini."
            columns={["Topik", "Penguasaan (%)"]}
            rows={r.topics.map((x) => [x.topic, num.format(x.mastery)])}
          >
            <TopicRadarChart data={r.topics.map((x) => ({ topic: x.topic, mastery: x.mastery }))} />
          </ChartFigure>
        )}
        <ChartFigure
          title="Nilai per topik"
          description="Dibanding rata-rata peserta lain di tryout yang sama. Topik terlemah di atas."
          columns={["Topik", "Benar", "Nilaimu (%)", "Rata-rata peserta (%)", "Rata-rata waktu (detik)"]}
          rows={r.topics.map((x) => [x.topic, `${x.correct}/${x.total}`, num.format(x.mastery), x.average === null ? "–" : num.format(x.average), Math.round(x.avgTimeSec)])}
        >
          <TopicCompareChart data={r.topics.map((x) => ({ topic: x.topic, mine: x.mastery, average: x.average }))} />
        </ChartFigure>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="kesulitan-judul" className="flex flex-col gap-3">
          <h2 id="kesulitan-judul" className="text-heading">
            Akurasi dan kecepatan
          </h2>
          <div className="relative overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
            <table className="w-full text-left">
              <caption className="sr-only">Akurasi per tingkat kesulitan</caption>
              <thead className="bg-secondary text-sm">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Tingkat</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Benar</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Akurasi</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Waktu per soal</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {r.difficulty.map((d) => (
                  <tr key={d.difficulty} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                    <th scope="row" className="px-4 py-3 font-semibold">{difficultyLabel[d.difficulty]}</th>
                    <td className="px-4 py-3 text-right">
                      {d.correct}/{d.total}
                    </td>
                    <td className="px-4 py-3 text-right">{Math.round((d.correct / d.total) * 100)}%</td>
                    <td className="px-4 py-3 text-right">{d.avgTimeSec} detik</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="rekomendasi-judul" className="flex flex-col gap-3">
          <h2 id="rekomendasi-judul" className="text-heading">
            Yang perlu dipelajari
          </h2>
          {r.recommendations.length === 0 ? (
            <p className="flex items-start gap-2 rounded-xl bg-accent px-4 py-3">
              <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              Semua topik di percobaan ini sudah di atas 70%. Pertahankan dengan latihan rutin.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {r.recommendations.map((x, i) => (
                <li key={x.topic} className="flex gap-3 rounded-xl bg-accent px-4 py-3">
                  <span className="font-bold text-primary tabular-nums">{i + 1}.</span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span>
                      Ulangi <strong>{x.topic}</strong> ({x.subject}, penguasaan {num.format(x.mastery)}%)
                    </span>
                    <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {x.course && (
                        <Link href={`/kelas/${x.course.slug}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                          <BookOpen aria-hidden="true" className="size-4" />
                          Kelas {x.course.title}
                        </Link>
                      )}
                      <Link href={`/video?mapel=${encodeURIComponent(x.subject)}`} className="font-semibold text-primary hover:underline">
                        Video {x.subject}
                      </Link>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
      </div>
    </>
  );
}

function ResultSkeleton() {
  return (
    <div className="page-container flex flex-col gap-8 py-10" aria-busy="true" aria-label="Memuat hasil">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

// Halaman hasil tryout (I.6, J.2). Hanya pemilik percobaan dan admin.
export default function HasilPage({ params }: PageProps<"/tryout/hasil/[attemptId]">) {
  return (
    <main className="flex flex-col">
      <Suspense fallback={<ResultSkeleton />}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}
