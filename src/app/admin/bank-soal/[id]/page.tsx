import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { QuestionActions } from "@/components/admin/questions/question-actions";
import { QuestionForm } from "@/components/admin/questions/question-form";
import { QuestionPreview } from "@/components/admin/questions/question-preview";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { getQuestion, getQuestionMeta, questionDefaults } from "@/features/admin/questions/queries";
import { formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah soal", robots: { index: false } };

async function Content({ params }: { params: PageProps<"/admin/bank-soal/[id]">["params"] }) {
  const { id } = await params;
  await adminPage(`/admin/bank-soal/${id}`);
  const [q, meta] = await Promise.all([getQuestion(id), getQuestionMeta()]);
  if (!q) notFound();
  const usedIn = q.examQuestions.length;

  return (
    <>
      <Breadcrumb items={[{ label: "Bank soal", href: "/admin/bank-soal" }, { label: `${q.subject}: ${q.topic}` }]} />
      <DashboardHeading title={`${q.subject}: ${q.topic}`} action={<QuestionActions id={q.id} usedIn={usedIn} />}>
        {q.category.name}, dibuat {q.createdBy.name}, diubah {formatTanggalJam(q.updatedAt)}
      </DashboardHeading>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusBadge tone={publishTone[q.status]} variant="box">
          {publishLabel[q.status]}
        </StatusBadge>
        <span className="text-sm text-muted-foreground">
          {usedIn === 0
            ? "Belum dipakai tryout."
            : `Dipakai di ${q.examQuestions.map((e) => `${e.exam.title} (${e.section.title})`).join(", ")}. Perubahan kunci tidak menilai ulang percobaan yang sudah selesai.`}
        </span>
      </div>

      {/* M.5.4: pratinjau seperti di halaman ujian, berdampingan dengan editor. */}
      <Tabs defaultValue="ubah">
        <TabsList>
          <TabsTrigger value="ubah">Ubah</TabsTrigger>
          <TabsTrigger value="pratinjau">Pratinjau</TabsTrigger>
        </TabsList>
        <TabsContent value="ubah" className="pt-4">
          <QuestionForm
            defaults={questionDefaults(q)}
            categories={meta.categories}
            subjects={meta.subjects}
            topics={meta.topics}
            image={q.imageId && q.imageUrl ? { id: q.imageId, url: q.imageUrl, name: "Gambar soal" } : null}
          />
        </TabsContent>
        <TabsContent value="pratinjau" className="pt-4">
          <DashboardSection title="Pratinjau soal">
            <QuestionPreview q={q} />
          </DashboardSection>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function EditQuestionPage({ params }: PageProps<"/admin/bank-soal/[id]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
