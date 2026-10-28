import type { Metadata } from "next";
import { Suspense } from "react";

import { CourseForm } from "@/components/admin/courses/course-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { getExamCategories } from "@/features/admin/exams/queries";
import { listSubjectNames } from "@/features/admin/subjects";
import { adminPage } from "@/features/admin/guard";

export const metadata: Metadata = { title: "Buat kelas", robots: { index: false } };

async function Content() {
  await adminPage("/admin/kelas/baru");
  const [categories, subjects] = await Promise.all([getExamCategories(), listSubjectNames()]);
  return (
    <CourseForm
      categories={categories}
      subjects={subjects}
      defaults={{
        title: "",
        slug: "",
        summary: "",
        description: "",
        categoryId: categories[0]?.id ?? "",
        subject: "",
        level: "SEDANG",
        status: "DRAF",
        sequentialLock: false,
        thumbnailId: null,
        certificate: true,
      }}
    />
  );
}

export default function NewCoursePage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Kelas", href: "/admin/kelas" }, { label: "Buat kelas" }]} />
      <DashboardHeading title="Buat kelas">Simpan dulu; bab dan materi disusun setelahnya.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
