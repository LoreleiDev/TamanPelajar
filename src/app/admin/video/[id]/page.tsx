import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { VideoForm } from "@/components/admin/video-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { getExamCategories } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";
import { getAdminVideo } from "@/features/admin/videos";
import { formatClock } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah video", robots: { index: false } };

async function Content({ params }: { params: PageProps<"/admin/video/[id]">["params"] }) {
  const { id } = await params;
  await adminPage(`/admin/video/${id}`);
  const [v, categories] = await Promise.all([getAdminVideo(id), getExamCategories()]);
  if (!v) notFound();
  return (
    <>
      <Breadcrumb items={[{ label: "Video", href: "/admin/video" }, { label: v.title }]} />
      <DashboardHeading title={v.title}>
        {v._count.progress} penonton.{" "}
        {v.status === "TERBIT" && (
          <Link href={`/video/${v.slug}`} className="text-primary hover:underline">
            Buka halaman publik
          </Link>
        )}
      </DashboardHeading>
      {v.lessons.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Dipakai di materi:{" "}
          {v.lessons.map((l, i) => (
            <span key={l.id}>
              {i > 0 && ", "}
              <Link href={`/admin/kelas/${l.section.course.id}`} className="hover:text-primary">
                {l.section.course.title}: {l.title}
              </Link>
            </span>
          ))}
          . Durasi materi ikut diperbarui saat durasi video diubah.
        </p>
      )}
      <VideoForm
        categories={categories}
        usedInLessons={v.lessons.length}
        defaults={{
          id: v.id,
          title: v.title,
          slug: v.slug,
          description: v.description,
          transcript: v.transcript ?? "",
          url: v.url,
          duration: formatClock(v.durationSec),
          subject: v.subject,
          difficulty: v.difficulty,
          categoryId: v.categoryId,
          thumbnailId: v.thumbnailId,
          status: v.status,
        }}
      />
    </>
  );
}

export default function EditVideoPage({ params }: PageProps<"/admin/video/[id]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
