import { Award } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getCertificates } from "@/features/dashboard/queries";
import { formatTanggal } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Sertifikat", robots: { index: false } };

async function Content() {
  const user = await requireUserPage("/dashboard/sertifikat");
  const certs = await getCertificates(user.id);
  return (
    <>
      <DashboardHeading title="Sertifikat">Sertifikat terbit otomatis saat semua materi sebuah kelas selesai.</DashboardHeading>
      {certs.length === 0 ? (
        <EmptyState
          title="Belum ada sertifikat"
          description="Selesaikan semua materi di satu kelas untuk mendapatkan sertifikat pertamamu."
          action={
            <Button asChild>
              <Link href="/dashboard/kelas">Lanjutkan kelas</Link>
            </Button>
          }
        />
      ) : (
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
