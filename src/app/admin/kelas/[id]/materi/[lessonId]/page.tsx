import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LessonForm, MaterialsEditor, QuizEditor } from "@/components/admin/courses/lesson-editor";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getAdminLesson } from "@/features/admin/courses/queries";
import { lessonTypeLabel } from "@/features/admin/courses/schemas";
import { getExamCategories } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";
import { getQuestionMeta } from "@/features/admin/questions/queries";
import { listVideoOptions } from "@/features/admin/videos";

export const metadata: Metadata = { title: "Ubah materi", robots: { index: false } };

async function Content({ params }: { params: PageProps<"/admin/kelas/[id]/materi/[lessonId]">["params"] }) {
  const { id, lessonId } = await params;
  await adminPage(`/admin/kelas/${id}/materi/${lessonId}`);
  const [lesson, videos, categories, meta] = await Promise.all([getAdminLesson(id, lessonId), listVideoOptions(), getExamCategories(), getQuestionMeta()]);
  if (!lesson) notFound();
  const course = lesson.section.course;

  return (
    <>
      <Breadcrumb items={[{ label: "Kelas", href: "/admin/kelas" }, { label: course.title, href: `/admin/kelas/${course.id}?tab=kurikulum` }, { label: lesson.title }]} />
      <DashboardHeading
        title={lesson.title}
        action={
          <Button asChild variant="outline">
            <Link href={`/kelas/${course.slug}/${lesson.slug}`}>
              <ExternalLink data-icon="inline-start" />
              Lihat sebagai siswa
            </Link>
          </Button>
        }
      >
        {lessonTypeLabel[lesson.type]} di {lesson.section.title}
      </DashboardHeading>

      <LessonForm
        sections={course.sections}
        videos={videos}
        defaults={{
          id: lesson.id,
          sectionId: lesson.sectionId,
          title: lesson.title,
          slug: lesson.slug,
          summary: lesson.summary ?? "",
          type: lesson.type,
          content: lesson.content ?? "",
          videoId: lesson.videoId ?? "",
          durationMin: lesson.durationSec && !lesson.videoId ? String(Math.round(lesson.durationSec / 60)) : "",
        }}
      />

      <DashboardSection title="Lampiran PDF">
        <MaterialsEditor lessonId={lesson.id} materials={lesson.materials.map((m) => ({ id: m.id, title: m.title, bytes: m.media.bytes }))} />
      </DashboardSection>

      {lesson.type === "KUIS" && lesson.quiz && (
        <DashboardSection title="Kuis">
          <QuizEditor
            quiz={{ quizId: lesson.quiz.id, title: lesson.quiz.title, passingScore: String(lesson.quiz.passingScore) }}
            attempts={lesson.quiz._count.attempts}
            categories={categories}
            categoryId={course.categoryId}
            subjects={meta.subjects}
            questions={lesson.quiz.questions.map((q) => ({
              id: q.id,
              excerpt: q.question.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
              type: q.question.type,
              topic: q.question.topic,
              difficulty: q.question.difficulty,
              draft: q.question.status !== "TERBIT" || q.question.deletedAt !== null,
            }))}
          />
        </DashboardSection>
      )}
    </>
  );
}

// Ubah materi kelas (L.2.3–L.2.5).
export default function EditLessonPage({ params }: PageProps<"/admin/kelas/[id]/materi/[lessonId]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
