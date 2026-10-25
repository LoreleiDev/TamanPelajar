import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CertificateTitleForm } from "@/components/admin/certificate-title-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { listCertificates } from "@/features/admin/certificates";
import { adminPage } from "@/features/admin/guard";
import { formatTanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Sertifikat", robots: { index: false } };

async function Content() {
  await adminPage("/admin/sertifikat");
  const { certificates, coursesWithout } = await listCertificates();
  return (
    <>
      {certificates.length === 0 ? (
        <EmptyState title="Belum ada sertifikat" description="Aktifkan sertifikat di pengaturan kelas; siswa mendapatkannya setelah menyelesaikan semua materi." />
      ) : (
        <ol className="flex flex-col gap-4">
          {certificates.map((c) => (
            <li key={c.id}>
              <section aria-labelledby={`sertif-${c.id}`} className="flex flex-col gap-3 rounded-xl border border-border p-5">
                <header className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={`sertif-${c.id}`} className="text-lg font-bold">
                    {c.course ? (
                      <Link href={`/admin/kelas/${c.course.id}`} className="hover:text-primary">
                        {c.course.title}
                      </Link>
                    ) : (
                      "Kelas sudah dihapus"
                    )}
                  </h2>
                  <span className="text-sm text-muted-foreground tabular-nums">{c._count.issued} sertifikat terbit</span>
                </header>
                <CertificateTitleForm id={c.id} title={c.title} />
                {c.issued.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-primary">Lihat penerima</summary>
                    <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-120 text-left text-sm">
                        <caption className="sr-only">Penerima sertifikat {c.title}</caption>
                        <thead className="bg-secondary">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-semibold">Siswa</th>
                            <th scope="col" className="px-3 py-2 font-semibold">Nomor</th>
                            <th scope="col" className="px-3 py-2 font-semibold">Terbit</th>
                          </tr>
                        </thead>
                        <tbody className="tabular-nums">
                          {c.issued.map((u) => (
                            <tr key={u.id} className="border-t border-border">
                              <th scope="row" className="px-3 py-2 font-normal">
                                <Link href={`/admin/pengguna/${u.user.id}`} className="hover:text-primary">
                                  {u.user.name}
                                </Link>
                              </th>
                              <td className="px-3 py-2">
                                <Link href={`/sertifikat/${u.number}`} className="text-primary hover:underline">
                                  {u.number}
                                </Link>
                              </td>
                              <td className="px-3 py-2">{formatTanggal(u.issuedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </section>
            </li>
          ))}
        </ol>
      )}
      {coursesWithout.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Kelas tanpa sertifikat:{" "}
          {coursesWithout.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ", "}
              <Link href={`/admin/kelas/${c.id}`} className="hover:text-primary">
                {c.title}
              </Link>
            </span>
          ))}
          . Aktifkan lewat pengaturan kelas.
        </p>
      )}
    </>
  );
}

// Sertifikat kelas (M.1, G.4.6, C.1.9).
export default function AdminCertificatesPage() {
  return (
    <>
      <DashboardHeading title="Sertifikat">Sertifikat terbit otomatis saat siswa menyelesaikan semua materi kelas. Nomornya bisa diverifikasi di halaman publik.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
