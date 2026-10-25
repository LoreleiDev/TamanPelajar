import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { ExamRunner } from "@/components/exam/exam-runner";
import { Skeleton } from "@/components/ui/skeleton";
import { getExamSession } from "@/features/exam/queries";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Mengerjakan tryout", robots: { index: false } };

// TODO batch B: arahkan ke /tryout/hasil/[attemptId] setelah halaman hasil (I.6) ada.
const resultHref = () => "/dashboard/riwayat";

async function Content({ params }: { params: PageProps<"/ujian/[attemptId]">["params"] }) {
  const { attemptId } = await params;
  const user = await requireUserPage(`/ujian/${attemptId}`);
  const session = await getExamSession(attemptId, user.id);
  if (!session) notFound();
  if (session.state === "selesai") redirect(resultHref());
  return <ExamRunner session={session} resultHref={resultHref()} />;
}

function ExamSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6" aria-busy="true" aria-label="Memuat soal">
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="hidden h-80 lg:block" />
      </div>
    </div>
  );
}

// Halaman pengerjaan CBT (I.3–I.4): layout khusus tanpa navbar utama dan dekorasi.
export default function UjianPage({ params }: PageProps<"/ujian/[attemptId]">) {
  return (
    <Suspense fallback={<ExamSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
