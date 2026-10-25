import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PracticalReviewForm } from "@/components/admin/practical-review-form";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { adminPage } from "@/features/admin/guard";
import { getPracticalQueue } from "@/features/admin/practicals";
import { canRequestRevision } from "@/features/certificate/rules";
import { submissionStatusLabel } from "@/features/certificate/schemas";
import { formatTanggal, formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Tugas praktik", robots: { index: false } };

type Item = Awaited<ReturnType<typeof getPracticalQueue>>["pending"][number];

const tone: Record<Item["status"], StatusTone> = { MENUNGGU: "menunggu", DISETUJUI: "berhasil", REVISI: "menunggu", DITOLAK: "gagal" };

function SubmissionCard({ s, now }: { s: Item; now: Date }) {
  const { participant: p } = s;
  const course = p.batch.course;
  const minScore = course.certificate?.minScore;
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold">
          <Link href={`/admin/pengguna/${p.user.id}`} className="hover:text-primary">
            {p.user.name}
          </Link>
          <span className="font-normal text-muted-foreground">
            {" "}
            ·{" "}
            <Link href={`/admin/kelas/${course.id}?tab=batch`} className="hover:text-primary">
              {course.title}
            </Link>
            , {p.batch.name}
            {p.isRetake && ", mengulang gratis"}
          </span>
        </p>
        <span className="text-sm text-muted-foreground">Dikirim {formatTanggalJam(s.createdAt)}</span>
      </header>
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Rata-rata kuis</dt>
          <dd className="font-semibold tabular-nums">
            {p.finalScore === null ? "Kelas tanpa kuis" : p.finalScore.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
            {minScore !== undefined && p.finalScore !== null && <span className="font-normal text-muted-foreground"> (minimal {minScore})</span>}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Batas batch</dt>
          <dd className="font-semibold">{formatTanggal(p.batch.endsAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <StatusBadge tone={tone[s.status]}>{submissionStatusLabel[s.status]}</StatusBadge>
          </dd>
        </div>
      </dl>
      <a
        href={s.driveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 self-start font-semibold break-all text-primary hover:underline"
      >
        {s.driveUrl}
        <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
        <span className="sr-only"> (tab baru)</span>
      </a>
      {s.note && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Catatan siswa</p>
          <p className="max-w-[75ch] rounded-lg bg-secondary px-4 py-3 whitespace-pre-wrap">{s.note}</p>
        </div>
      )}
      {s.status === "MENUNGGU" ? (
        <PracticalReviewForm submissionId={s.id} canRevise={canRequestRevision({ revisionsGiven: p._count.submissions, now, endsAt: p.batch.endsAt })} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Dinilai {s.reviewedBy?.name ?? "admin"}
          {s.reviewedAt && `, ${formatTanggalJam(s.reviewedAt)}`}
          {s.reviewNote && `. Catatan: ${s.reviewNote}`}
        </p>
      )}
    </article>
  );
}

async function Content() {
  await adminPage("/admin/tugas-praktik");
  const { pending, reviewed } = await getPracticalQueue();
  const now = new Date();
  return (
    <>
      <DashboardSection title={`Menunggu penilaian (${pending.length})`}>
        {pending.length === 0 ? (
          <EmptyState title="Tidak ada tugas yang menunggu" description="Tugas muncul di sini setelah siswa memenuhi syarat nilai dan mengirim link Google Drive." />
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((s) => (
              <SubmissionCard key={s.id} s={s} now={now} />
            ))}
          </div>
        )}
      </DashboardSection>
      {reviewed.length > 0 && (
        <DashboardSection title="Baru dinilai">
          <div className="flex flex-col gap-4">
            {reviewed.map((s) => (
              <SubmissionCard key={s.id} s={s} now={now} />
            ))}
          </div>
        </DashboardSection>
      )}
    </>
  );
}

// Penilaian tugas praktik sertifikat (revisi RMED, C.2.5, L.2.7).
export default function AdminPracticalPage() {
  return (
    <>
      <DashboardHeading title="Tugas praktik">
        Setujui untuk menerbitkan sertifikat, minta revisi sekali bila ada yang perlu diperbaiki, atau tolak agar siswa mengulang gratis di batch berikutnya.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
