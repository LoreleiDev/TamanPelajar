import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { ReviewViewer } from "@/components/exam/review-viewer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { getReview } from "@/features/exam/results";
import { formatTanggalJam } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Pembahasan tryout", robots: { index: false } };

async function Content({
  params,
  searchParams,
}: {
  params: PageProps<"/tryout/pembahasan/[attemptId]">["params"];
  searchParams: PageProps<"/tryout/pembahasan/[attemptId]">["searchParams"];
}) {
  const { attemptId } = await params;
  const user = await requireUserPage(`/tryout/pembahasan/${attemptId}`);
  const review = await getReview(attemptId, user);
  if (review.kind === "tidak-ada") notFound();
  if (review.kind === "berlangsung") redirect(`/ujian/${attemptId}`);
  const back = (
    <Button asChild variant="outline" className="self-start">
      <Link href={`/tryout/hasil/${attemptId}`}>Kembali ke hasil</Link>
    </Button>
  );

  if (review.kind === "tertutup") {
    return (
      <div className="page-container py-10 md:py-12">
      <div className="flex flex-col gap-4 rounded-xl bg-secondary p-6">
        <h1 className="flex items-center gap-2 text-heading">
          <Lock aria-hidden="true" className="size-6 text-primary" />
          Pembahasan belum tersedia
        </h1>
        <p>
          {review.opensAt
            ? `Pembahasan ${review.exam.title} dibuka ${formatTanggalJam(review.opensAt)}.`
            : `Pembahasan ${review.exam.title} tidak ditampilkan oleh penyelenggara.`}
        </p>
        {back}
      </div>
      </div>
    );
  }

  const soal = Number((await searchParams).soal);
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Tryout", href: "/tryout" }, { label: "Hasil", href: `/tryout/hasil/${attemptId}` }, { label: "Pembahasan" }]}
        eyebrow="Pembahasan"
        title={review.exam.title}
      >
        {back}
      </PageHeader>
      <div className="page-container py-10 md:py-12">
        <ReviewViewer review={review} initialNumber={Number.isInteger(soal) && soal > 0 ? soal : 1} />
      </div>
    </>
  );
}

// Halaman pembahasan (I.7): hanya setelah percobaan selesai dan pembahasan dibuka.
export default function PembahasanPage({ params, searchParams }: PageProps<"/tryout/pembahasan/[attemptId]">) {
  return (
    <main className="flex flex-col">
      <Suspense
        fallback={
          <div className="page-container flex flex-col gap-6 py-10" aria-busy="true" aria-label="Memuat pembahasan">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
