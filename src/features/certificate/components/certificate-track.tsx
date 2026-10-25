import { Award, Circle, CircleCheck, Download, ExternalLink, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { materialsDone, scoreMet } from "@/features/certificate/rules";
import { participantStatusLabel, submissionStatusLabel } from "@/features/certificate/schemas";
import type { CertificateTrack } from "@/features/certificate/service";
import { formatTanggal, formatTanggalJam } from "@/lib/format";
import { cn } from "@/lib/utils";

import { PracticalSubmitForm } from "./practical-submit-form";

const statusTone: Record<keyof typeof participantStatusLabel, StatusTone> = {
  BERJALAN: "netral",
  MENUNGGU_PENILAIAN: "menunggu",
  REVISI: "menunggu",
  LULUS: "berhasil",
  GAGAL: "gagal",
};

const submissionTone: Record<keyof typeof submissionStatusLabel, StatusTone> = {
  MENUNGGU: "menunggu",
  DISETUJUI: "berhasil",
  REVISI: "menunggu",
  DITOLAK: "gagal",
};

const score = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  const Icon: LucideIcon = done ? CircleCheck : Circle;
  return (
    <li className="flex items-start gap-2.5">
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", done ? "text-primary" : "text-muted-foreground")} />
      <span>
        {children}
        <span className="sr-only">{done ? " (terpenuhi)" : " (belum)"}</span>
      </span>
    </li>
  );
}

/** Status sertifikat sebuah kelas, bila siswa sudah punya sertifikat atau ikut batch. */
function statusOf(track: CertificateTrack) {
  if (track.certificateNumber) return { tone: "berhasil" as const, label: "Sertifikat terbit" };
  if (!track.participant) return null;
  return { tone: statusTone[track.participant.status], label: participantStatusLabel[track.participant.status] };
}

/** Ringkasan di sidebar ruang belajar; detail dan form ada di dashboard sertifikat. */
export function CertificateTrackSummary({ track }: { track: CertificateTrack }) {
  const status = statusOf(track);
  const r = track.requirement;
  return (
    <section aria-labelledby="sertifikat-ringkas" className="flex flex-col gap-2.5 rounded-xl border border-border p-4">
      <h2 id="sertifikat-ringkas" className="flex items-center gap-2 font-bold">
        <Award aria-hidden="true" className="size-5 text-primary" />
        Sertifikat
      </h2>
      {status && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      {track.certificateNumber ? null : r ? (
        <p className="text-sm text-muted-foreground tabular-nums">
          {r.completed}/{r.total} materi · rata-rata kuis {r.average === null ? "tanpa kuis" : score(r.average)} (minimal {track.minScore})
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {track.nextBatch ? `Batch berikutnya mulai ${formatTanggal(track.nextBatch.startsAt)}.` : "Ikuti batch yang berjalan untuk mendapatkan sertifikat."}
        </p>
      )}
      <Button asChild size="sm" variant="outline">
        <Link href={track.certificateNumber ? `/sertifikat/${track.certificateNumber}` : `/dashboard/sertifikat#kelas-${track.courseId}`}>
          {track.certificateNumber ? "Lihat sertifikat" : "Lihat syarat dan tugas praktik"}
        </Link>
      </Button>
    </section>
  );
}

/** Kartu lengkap di dashboard sertifikat: syarat, batch, template, form, dan riwayat kiriman. */
export function CertificateTrackCard({ track, courseTitle, courseSlug }: { track: CertificateTrack; courseTitle: string; courseSlug: string }) {
  const status = statusOf(track);
  const r = track.requirement;
  const p = track.participant;
  const revisionNote = p?.status === "REVISI" ? track.submissions.find((s) => s.status === "REVISI")?.reviewNote : null;

  return (
    <section id={`kelas-${track.courseId}`} aria-labelledby={`judul-${track.courseId}`} className="flex scroll-mt-24 flex-col gap-4 rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={`judul-${track.courseId}`} className="text-lg font-bold">
            <Link href={`/kelas/${courseSlug}`} className="hover:text-primary">
              {courseTitle}
            </Link>
          </h2>
          <p className="text-sm text-muted-foreground">
            {p ? `${p.batchName}${track.batch && p.batchName === track.batch.name ? `, sampai ${formatTanggal(track.batch.endsAt)}` : ""}` : track.batch ? `${track.batch.name}, sampai ${formatTanggal(track.batch.endsAt)}` : null}
            {p?.isRetake && " · mengulang gratis"}
          </p>
        </div>
        {status && <StatusBadge tone={status.tone} variant="box">{status.label}</StatusBadge>}
      </header>

      {track.certificateNumber ? (
        <Button asChild className="self-start">
          <Link href={`/sertifikat/${track.certificateNumber}`}>
            <Award data-icon="inline-start" aria-hidden="true" />
            Lihat dan unduh sertifikat
          </Link>
        </Button>
      ) : (
        <>
          {r && (
            <ul className="flex flex-col gap-2" aria-label="Syarat sertifikat">
              <Step done={materialsDone(r)}>
                Selesaikan semua materi <span className="text-muted-foreground tabular-nums">({r.completed}/{r.total})</span>
              </Step>
              <Step done={scoreMet(r)}>
                Rata-rata nilai terbaik kuis minimal {track.minScore}{" "}
                <span className="text-muted-foreground tabular-nums">(sekarang {r.average === null ? "kelas tanpa kuis" : score(r.average)})</span>
              </Step>
              <Step done={false}>Tugas praktik disetujui admin</Step>
            </ul>
          )}

          {p?.status === "GAGAL" && (
            <div className="flex flex-col gap-1 rounded-lg bg-secondary p-3 text-sm">
              <p className="font-semibold">Belum lulus di {p.batchName}.</p>
              {p.failReason && <p>{p.failReason}</p>}
              <p>
                {track.nextBatch
                  ? `Kamu bisa mengulang kelas ini gratis di ${track.nextBatch.name} mulai ${formatTanggal(track.nextBatch.startsAt)}. Progres dan nilai kuis dimulai dari awal.`
                  : "Kamu bisa mengulang gratis saat batch berikutnya dibuka admin."}
              </p>
            </div>
          )}

          {!p && (
            <p className="text-sm text-muted-foreground">
              {track.batch
                ? "Berlangganan paket yang mencakup kelas ini untuk ikut batch dan mendapatkan sertifikat."
                : track.nextBatch
                  ? `Batch berikutnya, ${track.nextBatch.name}, mulai ${formatTanggal(track.nextBatch.startsAt)}.`
                  : "Belum ada batch yang berjalan."}
            </p>
          )}

          {p && p.status !== "GAGAL" && (track.instructions || track.hasTemplate) && (
            <div className="flex flex-col gap-2">
              <h3 className="font-bold">Tugas praktik</h3>
              {track.instructions && <p className="max-w-[70ch] whitespace-pre-line">{track.instructions}</p>}
              {track.hasTemplate && (
                <Button asChild variant="outline" size="sm" className="self-start">
                  <a href={`/api/tugas-praktik/${track.courseId}`}>
                    <Download data-icon="inline-start" aria-hidden="true" />
                    Unduh template tugas
                  </a>
                </Button>
              )}
            </div>
          )}

          {revisionNote && (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <p className="font-semibold">Catatan revisi dari admin</p>
              <p className="whitespace-pre-line">{revisionNote}</p>
            </div>
          )}

          {track.canSubmit && <PracticalSubmitForm courseId={track.courseId} isRevision={p?.status === "REVISI"} />}
          {p?.status === "BERJALAN" && r && !track.canSubmit && (
            <p className="text-sm text-muted-foreground">Form tugas praktik terbuka setelah dua syarat di atas terpenuhi.</p>
          )}
        </>
      )}

      {track.submissions.length > 0 && !track.certificateNumber && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Riwayat kiriman</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {track.submissions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StatusBadge tone={submissionTone[s.status]}>{submissionStatusLabel[s.status]}</StatusBadge>
                <span className="text-muted-foreground tabular-nums">{formatTanggalJam(s.createdAt)}</span>
                <a href={s.driveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  Buka link
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                  <span className="sr-only"> (tab baru)</span>
                </a>
                {s.reviewNote && !(p?.status === "REVISI" && s.status === "REVISI") && <span className="w-full text-muted-foreground">Catatan: {s.reviewNote}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
