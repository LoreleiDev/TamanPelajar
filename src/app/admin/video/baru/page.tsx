import type { Metadata } from "next";
import { Suspense } from "react";

import { VideoForm } from "@/components/admin/video-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { getExamCategories } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";

export const metadata: Metadata = { title: "Tambah video", robots: { index: false } };

async function Content() {
  await adminPage("/admin/video/baru");
  const categories = await getExamCategories();
  return (
    <VideoForm
      categories={categories}
      usedInLessons={0}
      defaults={{
        title: "",
        slug: "",
        description: "",
        transcript: "",
        url: "",
        duration: "",
        subject: "",
        difficulty: "SEDANG",
        categoryId: categories[0]?.id ?? "",
        thumbnailId: null,
        status: "DRAF",
      }}
    />
  );
}

export default function NewVideoPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Video", href: "/admin/video" }, { label: "Tambah video" }]} />
      <DashboardHeading title="Tambah video" />
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
