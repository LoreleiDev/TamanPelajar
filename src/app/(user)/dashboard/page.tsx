import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ChartFigure } from "@/components/charts/chart-figure";
import { CompareChart, ScoreTrendChart, StudyTimeChart, TopicMasteryChart } from "@/components/charts/charts";
import { DashboardHeading, DashboardSection, DashboardSkeleton, StatRow } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { Button } from "@/components/ui/button";
import {
  getActivity,
  getComparison,
  getCourseProgress,
  getMyExams,
  getPrograms,
  getRecommendations,
  getResults,
  getStudyTime,
  getTopicMastery,
} from "@/features/dashboard/queries";
import { formatStudyTime, formatTanggal, formatTanggalJam } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const weekLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Jakarta" }).format(new Date()));
  return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 19 ? "Selamat sore" : "Selamat malam";
}

async function Ringkasan() {
  const user = await requireUserPage("/dashboard");
  const [programs, courses, results, study, topics, comparison, exams, activity] = await Promise.all([
    getPrograms(user.id),
    getCourseProgress(user.id),
    getResults(user.id),
    getStudyTime(user.id),
    getTopicMastery(user.id),
    getComparison(user.id),
    getMyExams(user.id),
    getActivity(user.id),
  ]);
  const recommendations = await getRecommendations(user.id, topics, courses);
  const active = programs.filter((p) => p.active);
  const latest = results[0];
  const average = results.length ? results.reduce((n, r) => n + r.percent, 0) / results.length : null;
  const lastCourse = courses.find((c) => c.lastAccessAt);
  const trend = [...results].reverse().map((r) => ({ label: `${r.examTitle.replace("Tryout ", "")} #${r.attemptNo}`, percent: r.percent }));

  return (
    <>
      {/* Sapaan (F.2.1) */}
      <DashboardHeading title={`${greeting()}, ${user.name.split(" ")[0]}`}>
        {active.length
          ? `Kamu punya ${active.length} program aktif. Lanjutkan dari materi terakhir atau coba tryout berikutnya.`
          : "Belum ada program aktif. Bab 1 dan 2 setiap kelas tetap bisa kamu buka gratis."}
      </DashboardHeading>

      {/* Nilai terbaru, rata-rata, waktu belajar (F.2.6–F.2.8) */}
      <StatRow
        items={[
          { label: "Nilai tryout terbaru", value: latest ? `${num.format(latest.percent)}%` : "–", hint: latest?.examTitle },
          { label: "Rata-rata nilai", value: average !== null ? `${num.format(average)}%` : "–", hint: `${results.length} percobaan` },
          { label: "Belajar minggu ini", value: formatStudyTime(study.thisWeekSeconds), hint: `Total ${formatStudyTime(study.totalSeconds)}` },
          { label: "Program aktif", value: active.length, hint: active[0] ? `s.d. ${formatTanggal(active[0].expiresAt)}` : undefined },
        ]}
      />

      <div className="grid gap-8 xl:grid-cols-2">
        {/* Program aktif (F.2.2) dan progres belajar (F.2.3) */}
        <DashboardSection
          title="Progres belajar"
          action={
            <Link href="/dashboard/kelas" className="text-sm font-semibold text-primary hover:underline">
              Semua kelas
            </Link>
          }
        >
          {courses.length === 0 ? (
            <EmptyState
              title="Belum ada kelas yang dimulai"
              description="Buka bab 1 kelas mana pun untuk mulai mencatat progres."
              action={
                <Button asChild>
                  <Link href="/kelas">Lihat kelas</Link>
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {courses.slice(0, 4).map((c) => (
                <li key={c.slug} className="flex flex-col gap-1.5">
                  <GrowthProgress value={c.percent} label={c.title} />
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {c.completed} dari {c.total} materi
                    {c.nextLesson && (
                      <>
                        {". "}
                        <Link href={`/kelas/${c.slug}/${c.nextLesson.slug}`} className="font-semibold text-primary hover:underline">
                          Lanjut: {c.nextLesson.title}
                        </Link>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <div className="flex flex-col gap-8">
          {/* Kelas terakhir diakses (F.2.5) */}
          {lastCourse && (
            <DashboardSection title="Kelas terakhir diakses">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div>
                  <p className="font-bold">{lastCourse.title}</p>
                  <p className="text-sm text-muted-foreground">Dibuka {formatTanggalJam(lastCourse.lastAccessAt!)}</p>
                </div>
                {lastCourse.nextLesson && (
                  <Button asChild>
                    <Link href={`/kelas/${lastCourse.slug}/${lastCourse.nextLesson.slug}`}>Lanjutkan</Link>
                  </Button>
                )}
              </div>
            </DashboardSection>
          )}

          {/* Jadwal tryout (F.2.4) */}
          <DashboardSection title="Jadwal tryout">
            {exams.length === 0 ? (
              <p className="text-muted-foreground">Tryout muncul di sini setelah kamu membeli paket yang berisi tryout.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" /* taste-skill-ignore: daftar padat dashboard, border tipis sesuai CLAUDE.md */>
                {exams.map((e) => (
                  <li key={e.slug} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <p className="font-semibold">{e.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {e.closesAt ? `Ditutup ${formatTanggalJam(e.closesAt)}` : "Bisa dikerjakan kapan saja selama paket aktif"}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums">
                      {e.attemptsUsed}/{e.maxAttempts} percobaan
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          {/* Rekomendasi materi berikutnya (F.2.10, J.2.8) */}
          {recommendations.length > 0 && (
            <DashboardSection title="Rekomendasi belajar">
              <ul className="flex flex-col gap-2">
                {recommendations.map((r) => (
                  <li key={r.topic} className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-accent px-4 py-3">
                    <span>
                      Ulangi topik <strong>{r.topic}</strong>{" "}
                      <span className="text-muted-foreground tabular-nums">(penguasaan {r.mastery}%)</span>
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
            </DashboardSection>
          )}
        </div>
      </div>

      {/* Grafik (F.3) */}
      <div className="grid gap-8 xl:grid-cols-2">
        <ChartFigure
          title="Perkembangan nilai"
          description="Nilai tiap percobaan tryout, dalam persen dari nilai maksimum."
          columns={["Percobaan", "Nilai (%)"]}
          rows={trend.map((t) => [t.label, num.format(t.percent)])}
          empty={<p className="rounded-xl bg-secondary px-4 py-8 text-center text-sm text-muted-foreground">Kerjakan tryout pertama untuk melihat grafik ini.</p>}
        >
          <ScoreTrendChart data={trend} />
        </ChartFigure>
        <ChartFigure
          title="Penguasaan topik"
          description="Persentase jawaban benar per topik dari semua tryout. Topik terlemah di atas."
          columns={["Topik", "Benar", "Penguasaan (%)"]}
          rows={topics.map((t) => [t.topic, `${t.correct}/${t.total}`, t.mastery])}
        >
          <TopicMasteryChart data={topics.map((t) => ({ topic: t.topic, mastery: t.mastery }))} />
        </ChartFigure>
        <ChartFigure
          title="Waktu belajar per minggu"
          description="Menit menonton materi dan video, enam minggu terakhir."
          columns={["Minggu mulai", "Menit"]}
          rows={study.weekly.map((w) => [weekLabel.format(w.start), Math.round(w.seconds / 60)])}
        >
          <StudyTimeChart data={study.weekly.map((w) => ({ label: weekLabel.format(w.start), minutes: Math.round(w.seconds / 60) }))} />
        </ChartFigure>
        <ChartFigure
          title="Nilaimu dibanding rata-rata peserta"
          description="Nilai terbaik per tryout dibanding rata-rata nilai terbaik semua peserta."
          columns={["Tryout", "Nilaimu (%)", "Rata-rata (%)", "Peserta"]}
          rows={comparison.map((c) => [c.exam, num.format(c.mine), num.format(c.average), c.participants])}
        >
          <CompareChart data={comparison.map((c) => ({ exam: c.exam.replace("Tryout ", ""), mine: c.mine, average: c.average }))} />
        </ChartFigure>
      </div>

      {/* Aktivitas terakhir (F.2.9) */}
      <DashboardSection title="Aktivitas terakhir">
        {activity.length === 0 ? (
          <p className="text-muted-foreground">Belum ada aktivitas. Mulai dari bab gratis di kelas mana pun.</p>
        ) : (
          <ol className="flex flex-col">
            {activity.map((a, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
                {a.href ? (
                  <Link href={a.href} className="hover:text-primary">
                    {a.text}
                  </Link>
                ) : (
                  <span>{a.text}</span>
                )}
                <time dateTime={a.at.toISOString()} className="text-sm text-muted-foreground">
                  {formatTanggalJam(a.at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </DashboardSection>
    </>
  );
}

// Ringkasan dashboard siswa (F.2, F.3).
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Ringkasan />
    </Suspense>
  );
}
