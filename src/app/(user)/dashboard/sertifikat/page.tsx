import { Award } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { CertificateTrackCard } from "@/features/certificate/components/certificate-track";
import { listCertificateTracks } from "@/features/certificate/queries";
import { getCertificates } from "@/features/dashboard/queries";
import { formatTanggal } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Sertifikat", robots: { index: false } };

async function Content() {
  const user = await requireUserPage("/dashboard/sertifikat");
  // Jalur disinkronkan lebih dulu: persetujuan admin bisa menerbitkan sertifikat baru.
  const tracks = (await listCertificateTracks(user.id)).filter((t) => !t.certificateNumber);
  const certs = await getCertificates(user.id);
  return (
    <>
      <DashboardHeading title="Sertifikat">
        Sertifikat terbit setelah semua materi selesai, rata-rata nilai kuis mencapai batas minimal, dan tugas praktikmu disetujui admin.
      </DashboardHeading>
      {tracks.length > 0 && (
        <div className="flex flex-col gap-4">
          {tracks.map((t) => (
            <CertificateTrackCard key={t.courseId} track={t} courseTitle={t.courseTitle} courseSlug={t.courseSlug} />
          ))}
        </div>
      )}
      {certs.length === 0 && tracks.length > 0 ? null : certs.length === 0 ? (
        <EmptyState
          title="Belum ada sertifikat"
          description="Ikuti batch kelas dari paket yang kamu beli, lalu penuhi syaratnya untuk mendapatkan sertifikat pertamamu."
          action={
            <Button asChild>
              <Link href="/dashboard/kelas">Lanjutkan kelas</Link>
            </Button>
          }
        />
      ) : (
        <section aria-labelledby="sertifikat-terbit" className="flex flex-col gap-3">
        <h2 id="sertifikat-terbit" className="text-lg font-bold">Sertifikat terbit</h2>
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" /* taste-skill-ignore: daftar padat dashboard, border tipis sesuai CLAUDE.md */>
          {certs.map((c) => (
            <li key={c.number} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div className="flex items-start gap-3">
                <Award className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-bold">{c.certificate.title}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    Nomor {c.number}, terbit {formatTanggal(c.issuedAt)}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link href={`/sertifikat/${c.number}`}>Lihat dan unduh</Link>
              </Button>
            </li>
          ))}
        </ul>
        </section>
      )}
    </>
  );
}

// Sertifikat (F.1, C.1.9).
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
