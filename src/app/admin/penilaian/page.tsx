import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { GradeForm } from "@/components/admin/grade-form";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { getGradingQueue } from "@/features/admin/grading";
import { adminPage } from "@/features/admin/guard";
import { formatTanggalJam } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";

export const metadata: Metadata = { title: "Penilaian essay", robots: { index: false } };

type Item = Awaited<ReturnType<typeof getGradingQueue>>["pending"][number];

function EssayCard({ a }: { a: Item }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold">
          <Link href={`/admin/pengguna/${a.attempt.user.id}`} className="hover:text-primary">
            {a.attempt.user.name}
          </Link>
          <span className="font-normal text-muted-foreground">
            {" "}
            ·{" "}
            <Link href={`/admin/tryout/${a.attempt.exam.id}/hasil`} className="hover:text-primary">
              {a.attempt.exam.title}
            </Link>
            , percobaan ke-{a.attempt.attemptNo}, topik {a.question.topic}
          </span>
        </p>
        {a.attempt.submittedAt && <span className="text-sm text-muted-foreground">Dikumpulkan {formatTanggalJam(a.attempt.submittedAt)}</span>}
      </header>
      <div>
        <p className="text-sm font-semibold text-muted-foreground">Soal</p>
        <div className="rich-text max-w-[75ch]" dangerouslySetInnerHTML={{ __html: sanitizeRichText(a.question.body) }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-muted-foreground">Jawaban siswa</p>
        <p className="max-w-[75ch] rounded-lg bg-secondary px-4 py-3 whitespace-pre-wrap">{a.textAnswer}</p>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-primary">Pedoman dari pembahasan</summary>
        <div className="rich-text mt-2 max-w-[75ch]" dangerouslySetInnerHTML={{ __html: sanitizeRichText(a.question.explanation) }} />
      </details>
      <GradeForm answerId={a.id} maxScore={a.maxScore} current={a.gradedBy ? a.score : null} />
      {a.gradedBy && (
        <p className="text-sm text-muted-foreground">
          Dinilai {a.gradedBy}, {formatTanggalJam(a.gradedAt)}
        </p>
      )}
    </article>
  );
}

async function Content() {
  await adminPage("/admin/penilaian");
  const { pending, graded } = await getGradingQueue();
  return (
    <>
      <DashboardSection title={`Menunggu penilaian (${pending.length})`}>
        {pending.length === 0 ? (
          <EmptyState title="Semua essay sudah dinilai" description="Jawaban essay baru muncul di sini setelah siswa mengumpulkan tryout." />
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((a) => (
              <EssayCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </DashboardSection>
      {graded.length > 0 && (
        <DashboardSection title="Baru dinilai">
          <div className="flex flex-col gap-4">
            {graded.map((a) => (
              <EssayCard key={a.id} a={a} />
            ))}
          </div>
        </DashboardSection>
      )}
    </>
  );
}

// Penilaian essay (L.2.7).
export default function GradingPage() {
  return (
    <>
      <DashboardHeading title="Penilaian essay">Jawaban essay dinilai di sini; nilai akhir, kelulusan, dan analisis siswa langsung dihitung ulang.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
