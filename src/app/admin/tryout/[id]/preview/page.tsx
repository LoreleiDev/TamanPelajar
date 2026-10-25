import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { QuestionPreview } from "@/components/admin/questions/question-preview";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { getExamPreview } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";
import { questionMaxScore } from "@/features/scoring/score";

export const metadata: Metadata = { title: "Pratinjau tryout", robots: { index: false } };

const num = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

async function Content({ params }: { params: PageProps<"/admin/tryout/[id]/preview">["params"] }) {
  const { id } = await params;
  await adminPage(`/admin/tryout/${id}/preview`);
  const exam = await getExamPreview(id);
  if (!exam) notFound();
  // Skor maksimum per subtes dengan aturan yang sama seperti penilaian server.
  const maxOf = (s: (typeof exam.sections)[number]) =>
    s.questions.reduce((n, q) => n + questionMaxScore({ ...q, sectionId: s.id, options: q.options.map((o) => ({ ...o })) }, exam), 0) * s.weight;
  const total = exam.sections.reduce((n, s) => n + maxOf(s), 0);
  let number = 0;

  return (
    <>
      <Breadcrumb items={[{ label: "Tryout", href: "/admin/tryout" }, { label: exam.title, href: `/admin/tryout/${exam.id}` }, { label: "Pratinjau" }]} />
      <DashboardHeading title={`Pratinjau: ${exam.title}`}>
        Urutan asli tanpa pengacakan, lengkap dengan kunci. Durasi {exam.durationMin} menit, skor maksimum {num(total)}, passing grade {num(exam.passingGrade)}.
      </DashboardHeading>
      {exam.sections.length === 0 ? (
        <p className="text-muted-foreground">Tryout ini belum punya subtes.</p>
      ) : (
        exam.sections.map((s) => (
          <DashboardSection key={s.id} title={`${s.title} (${s.questions.length} soal${s.durationMin ? `, ${s.durationMin} menit` : ""}, skor maks. ${num(maxOf(s))})`}>
            {s.questions.length === 0 ? (
              <p className="text-muted-foreground">Belum ada soal.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {s.questions.map((q) => (
                  <QuestionPreview key={q.id} q={q} number={++number} />
                ))}
              </div>
            )}
          </DashboardSection>
        ))
      )}
    </>
  );
}

// Pratinjau tryout (M.6.9).
export default function ExamPreviewPage({ params }: PageProps<"/admin/tryout/[id]/preview">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
