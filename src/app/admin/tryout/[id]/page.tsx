import { BarChart3, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ExamActions } from "@/components/admin/exams/exam-actions";
import { ExamForm } from "@/components/admin/exams/exam-form";
import { ExamStructure } from "@/components/admin/exams/exam-structure";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminExam, getExamCategories } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { getQuestionMeta } from "@/features/admin/questions/queries";
import { toJakartaInput } from "@/lib/datetime";

export const metadata: Metadata = { title: "Ubah tryout", robots: { index: false } };

const num = (n: number) => String(n).replace(".", ",");

async function Content({ params, searchParams }: { params: PageProps<"/admin/tryout/[id]">["params"]; searchParams: PageProps<"/admin/tryout/[id]">["searchParams"] }) {
  const { id } = await params;
  const { tab } = await searchParams;
  await adminPage(`/admin/tryout/${id}`);
  const [exam, categories, meta] = await Promise.all([getAdminExam(id), getExamCategories(), getQuestionMeta()]);
  if (!exam) notFound();

  return (
    <>
      <Breadcrumb items={[{ label: "Tryout", href: "/admin/tryout" }, { label: exam.title }]} />
      <DashboardHeading
        title={exam.title}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/tryout/${exam.id}/preview`}>
                <Eye data-icon="inline-start" />
                Pratinjau
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/tryout/${exam.id}/hasil`}>
                <BarChart3 data-icon="inline-start" />
                Hasil peserta
              </Link>
            </Button>
            <ExamActions id={exam.id} title={exam.title} />
          </div>
        }
      >
        {exam.category.name}, {exam.attemptCount} percobaan
        {exam.runningAttempts > 0 && `, ${exam.runningAttempts} sedang berlangsung`}
      </DashboardHeading>
      <StatusBadge tone={publishTone[exam.status]} variant="box">
        {publishLabel[exam.status]}
      </StatusBadge>

      <Tabs defaultValue={tab === "soal" ? "soal" : "pengaturan"}>
        <TabsList>
          <TabsTrigger value="pengaturan">Pengaturan</TabsTrigger>
          <TabsTrigger value="soal">Subtes dan soal</TabsTrigger>
        </TabsList>
        <TabsContent value="pengaturan" className="pt-4">
          <ExamForm
            categories={categories}
            image={exam.imageId && exam.imageUrl ? { id: exam.imageId, url: exam.imageUrl, name: "Gambar tryout" } : null}
            defaults={{
              id: exam.id,
              title: exam.title,
              slug: exam.slug,
              categoryId: exam.categoryId,
              description: exam.description,
              rules: exam.rules ?? "",
              imageId: exam.imageId,
              durationMin: String(exam.durationMin),
              opensAt: toJakartaInput(exam.opensAt),
              closesAt: toJakartaInput(exam.closesAt),
              maxAttempts: String(exam.maxAttempts),
              shuffleQuestions: exam.shuffleQuestions,
              shuffleOptions: exam.shuffleOptions,
              showDiscussion: exam.showDiscussion,
              discussionOpensAt: toJakartaInput(exam.discussionOpensAt),
              correctScore: num(exam.correctScore),
              wrongScore: num(exam.wrongScore),
              passingGrade: num(exam.passingGrade),
              status: exam.status,
            }}
          />
        </TabsContent>
        <TabsContent value="soal" className="pt-4">
          <ExamStructure
            examId={exam.id}
            locked={exam.attemptCount > 0}
            attemptCount={exam.attemptCount}
            categories={categories}
            categoryId={exam.categoryId}
            subjects={meta.subjects}
            sections={exam.sections.map((s) => ({
              id: s.id,
              title: s.title,
              durationMin: s.durationMin,
              weight: s.weight,
              passingGrade: s.passingGrade,
              questions: s.questions.map((q) => ({
                id: q.id,
                questionId: q.question.id,
                excerpt: q.question.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
                type: q.question.type,
                topic: q.question.topic,
                difficulty: q.question.difficulty,
                weight: q.weight,
                baseWeight: q.question.weight,
                draft: q.question.status !== "TERBIT",
                deleted: q.question.deletedAt !== null,
              })),
            }))}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

// Ubah tryout (M.6): pengaturan dan struktur.
export default function EditExamPage({ params, searchParams }: PageProps<"/admin/tryout/[id]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}
