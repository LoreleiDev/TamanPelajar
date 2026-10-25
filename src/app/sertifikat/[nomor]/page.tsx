import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Logo } from "@/components/layout/logo";
import { CheckList } from "@/components/shared/check-list";
import { OrganicCorners } from "@/components/shared/ornaments";
import { PrintButton } from "@/components/shared/print-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTanggal } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Sertifikat", robots: { index: false } };

// Dirender blocking agar nomor yang tidak terdaftar mengembalikan 404 (bukan 200 lalu 404).
export const instant = false;

async function Certificate({ params }: { params: PageProps<"/sertifikat/[nomor]">["params"] }) {
  const { nomor } = await params;
  await connection();
  const cert = await prisma.userCertificate.findUnique({
    where: { number: decodeURIComponent(nomor) },
    select: {
      number: true,
      issuedAt: true,
      user: { select: { name: true } },
      certificate: { select: { title: true, course: { select: { title: true, slug: true } } } },
    },
  });
  if (!cert) notFound();

  return (
    <>
      <article
        aria-label={`Sertifikat ${cert.certificate.title}`}
        className="relative overflow-hidden rounded-2xl border-2 border-primary bg-white p-8 md:p-14 print:rounded-none print:border-4" // taste-skill-ignore: bingkai sertifikat
      >
        <OrganicCorners />
        <div className="relative flex flex-col gap-8">
          <Logo size="lg" />
          <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold text-muted-foreground">Sertifikat penyelesaian kelas</p>
            <h1 className="text-title text-primary uppercase">{cert.user.name}</h1>
            <p className="text-lead max-w-[48ch]">
              telah menyelesaikan seluruh materi, kuis, dan tugas praktik kelas <strong>{cert.certificate.course?.title ?? cert.certificate.title}</strong>{" "}
              di Taman Pelajar.
            </p>
          </div>
          <CheckList items={["Pelatihan berkualitas", "Penilaian cermat", "Sertifikat akurat"]} className="font-semibold" />
          <dl className="grid gap-4 pt-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nomor sertifikat</dt>
              <dd className="font-bold tabular-nums">{cert.number}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tanggal terbit</dt>
              <dd className="font-bold">{formatTanggal(cert.issuedAt)}</dd>
            </div>
          </dl>
        </div>
      </article>
      <p className="text-sm text-muted-foreground print:hidden">
        Halaman ini sekaligus bukti keaslian: siapa pun dengan nomor sertifikat bisa memeriksanya di alamat ini.
      </p>
      <div className="flex flex-wrap gap-3 print:hidden">
        <PrintButton />
        {cert.certificate.course && (
          <Button asChild size="lg" variant="outline">
            <Link href={`/kelas/${cert.certificate.course.slug}`}>Kembali ke kelas</Link>
          </Button>
        )}
      </div>
    </>
  );
}

// Sertifikat (C.1.9, G.4.6): verifikasi publik dan versi cetak/PDF.
export default async function SertifikatPage({ params }: PageProps<"/sertifikat/[nomor]">) {
  await connection();
  const exists = await prisma.userCertificate.count({ where: { number: decodeURIComponent((await params).nomor) } });
  if (!exists) notFound();
  return (
    <main className="page-container flex max-w-4xl flex-col gap-6 py-10 print:max-w-none print:p-0">
      <Suspense fallback={<Skeleton className="h-[28rem] rounded-2xl" aria-label="Memuat sertifikat" />}>
        <Certificate params={params} />
      </Suspense>
    </main>
  );
}
