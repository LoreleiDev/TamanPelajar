import { CircleCheck, Clock, ListChecks, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listExams, getUserExamStates, type ExamListItem, type UserExamState } from "@/features/exam/queries";
import { formatTanggalJam } from "@/lib/format";
import { currentUser } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Tryout CBT",
  description:
    "Tryout UTBK/SNBT, SKD CPNS, dan TPA berbasis komputer: timer per subtes, jawaban tersimpan otomatis, nilai langsung keluar, dan pembahasan setiap soal.",
  alternates: { canonical: "/tryout" },
};

const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

function schedule(e: ExamListItem) {
  if (e.opensAt && e.closesAt) return `${formatTanggalJam(e.opensAt)} sampai ${formatTanggalJam(e.closesAt)}`;
  if (e.opensAt) return `Dibuka ${formatTanggalJam(e.opensAt)}`;
  if (e.closesAt) return `Ditutup ${formatTanggalJam(e.closesAt)}`;
  return "Bisa dikerjakan kapan saja";
}

function ExamRows({ exams, states }: { exams: ExamListItem[]; states: Map<string, UserExamState> | null }) {
  return (
    <ul className="flex flex-col gap-4">
      {exams.map((e) => {
        const st = states?.get(e.slug);
        const cta = st?.ongoingAttemptId ? "Lanjutkan" : st && !st.block ? "Mulai tryout" : "Lihat petunjuk";
        return (
          <li
            key={e.slug}
            className="grid gap-4 rounded-xl border border-border p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8"
          >
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm font-semibold text-primary">{e.category.name}</p>
              <h2 className="text-heading">
                <Link href={`/tryout/${e.slug}`} className="hover:text-primary">
                  {e.title}
                </Link>
              </h2>
              <p className="text-muted-foreground">{e.description}</p>
              <dl className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm tabular-nums">
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Jumlah soal</dt>
                  <ListChecks aria-hidden="true" className="size-4 text-primary" />
                  <dd>
                    {e.questionCount} soal, {e.sectionCount} subtes
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Durasi</dt>
                  <Clock aria-hidden="true" className="size-4 text-primary" />
                  <dd>{e.durationMin} menit</dd>
                </div>
                <div>
                  <dt className="sr-only">Jadwal</dt>
                  <dd>{schedule(e)}</dd>
                </div>
                <div>
                  <dt className="sr-only">Percobaan</dt>
                  <dd>
                    {st ? `${st.attemptsUsed} dari ${e.maxAttempts} percobaan` : `Maksimal ${e.maxAttempts} percobaan`}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:flex-col md:items-end">
              {st && (
                <dl className="flex gap-6 text-sm md:text-right">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="flex items-center gap-1 font-semibold md:justify-end">
                      {st.status === "Selesai" && <CircleCheck aria-hidden="true" className="size-4 text-primary" />}
                      {st.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nilai tertinggi</dt>
                    <dd className="font-semibold tabular-nums">{st.bestPercent !== null ? `${num.format(st.bestPercent)}%` : "–"}</dd>
                  </div>
                </dl>
              )}
              <Button asChild variant={st?.ongoingAttemptId || (st && !st.block) ? "default" : "outline"}>
                <Link href={st?.ongoingAttemptId ? `/ujian/${st.ongoingAttemptId}` : `/tryout/${e.slug}`}>
                  <PlayCircle aria-hidden="true" data-icon="inline-start" />
                  {cta}
                  <span className="sr-only"> {e.title}</span>
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

async function ExamRowsWithState({ exams }: { exams: ExamListItem[] }) {
  const user = await currentUser();
  const states = user ? await getUserExamStates(user) : null;
  return <ExamRows exams={exams} states={states} />;
}

// Daftar tryout (I.1). Data tryout di-cache; status dan nilai per pengguna menyusul lewat Suspense.
export default async function TryoutPage() {
  const exams = await listExams();
  return (
    <main className="flex flex-col">
      <PageHeader
        eyebrow="Ujian berbasis komputer"
        title="Tryout CBT"
        description="Simulasi ujian dengan waktu per subtes. Jawaban tersimpan otomatis, nilai keluar begitu kamu mengumpulkan, dan setiap soal dilengkapi pembahasan."
      />
      <div className="page-container flex flex-col gap-10 py-10 md:py-12">
      {exams.length === 0 ? (
        <EmptyState
          title="Belum ada tryout yang terbit"
          description="Tryout baru sedang disiapkan. Sementara itu, pelajari materinya di kelas online."
          action={
            <Button asChild>
              <Link href="/kelas">Lihat kelas online</Link>
            </Button>
          }
        />
      ) : (
        <Suspense fallback={<ExamRows exams={exams} states={null} />}>
          <ExamRowsWithState exams={exams} />
        </Suspense>
      )}
      </div>
    </main>
  );
}
