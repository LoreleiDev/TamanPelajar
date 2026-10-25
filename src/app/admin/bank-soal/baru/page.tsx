import type { Metadata } from "next";
import { Suspense } from "react";

import { QuestionForm } from "@/components/admin/questions/question-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { adminPage } from "@/features/admin/guard";
import { getQuestionMeta } from "@/features/admin/questions/queries";
import { OPTION_LABELS } from "@/features/admin/questions/schemas";

export const metadata: Metadata = { title: "Tambah soal", robots: { index: false } };

async function Content() {
  await adminPage("/admin/bank-soal/baru");
  const meta = await getQuestionMeta();
  return (
    <QuestionForm
      categories={meta.categories}
      subjects={meta.subjects}
      topics={meta.topics}
      image={null}
      defaults={{
        categoryId: meta.categories[0]?.id ?? "",
        subject: "",
        topic: "",
        difficulty: "SEDANG",
        type: "PG_TUNGGAL",
        body: "",
        explanation: "",
        explanationVideoUrl: "",
        imageId: null,
        correctText: "",
        correctNumber: "",
        tolerance: "",
        weight: "1",
        status: "DRAF",
        options: OPTION_LABELS.map(() => ({ body: "", isCorrect: false, score: "" })),
      }}
    />
  );
}

export default function NewQuestionPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Bank soal", href: "/admin/bank-soal" }, { label: "Tambah soal" }]} />
      <DashboardHeading title="Tambah soal" />
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
