import type { Metadata } from "next";
import { Suspense } from "react";

import { ExamForm } from "@/components/admin/exams/exam-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { getExamCategories } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";

export const metadata: Metadata = { title: "Buat tryout", robots: { index: false } };

async function Content() {
  await adminPage("/admin/tryout/baru");
  const categories = await getExamCategories();
  return (
    <ExamForm
      categories={categories}
      image={null}
      defaults={{
        title: "",
        slug: "",
        categoryId: categories[0]?.id ?? "",
        description: "",
        rules: "",
        imageId: null,
        durationMin: "60",
        opensAt: "",
        closesAt: "",
        maxAttempts: "1",
        shuffleQuestions: false,
        shuffleOptions: false,
        showDiscussion: true,
        discussionOpensAt: "",
        correctScore: "1",
        wrongScore: "0",
        passingGrade: "0",
        status: "DRAF",
      }}
    />
  );
}

export default function NewExamPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Tryout", href: "/admin/tryout" }, { label: "Buat tryout" }]} />
      <DashboardHeading title="Buat tryout">Simpan pengaturan dulu; subtes dan soal ditambahkan setelahnya.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
