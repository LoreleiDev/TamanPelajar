import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Course } from "schema-dts";

import { CourseOutlineList } from "@/components/course/course-outline-list";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseOutline, getLearnerState, listCourseSlugs, type CourseOutline } from "@/features/course/queries";
import { formatStudyTime, formatTanggal } from "@/lib/format";
import { currentUser } from "@/lib/rbac";

export async function generateStaticParams() {
  return (await listCourseSlugs()).map((slug) => ({ slug }));
}

// Semua kelas di-prerender; slug lain dirender blocking agar kelas yang tidak ada tetap 404.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/kelas/[slug]">): Promise<Metadata> {
  const outline = await getCourseOutline((await params).slug);
  if (!outline) return { title: "Kelas tidak ditemukan" };
  return {
    title: `Kelas ${outline.title}`,
    description: outline.summary,
    alternates: { canonical: `/kelas/${outline.slug}` },
  };
}

/** Kurikulum dengan status per pengguna (dinamis, membaca sesi). */
async function CourseState({ outline }: { outline: CourseOutline }) {
  const user = await currentUser();
  const state = await getLearnerState(outline, user);
  const byLesson = new Map(state.lessons.map((l) => [l.id, l]));
  const firstOpen = state.lessons.find((l) => l.access === "terbuka" && !l.completed) ?? state.lessons.find((l) => l.access === "terbuka");
  const resume = state.lastLessonSlug ?? firstOpen?.slug;

  return (
    <div className="flex flex-col gap-6">
      {user && (
        <div className="flex flex-col gap-4 rounded-xl bg-secondary p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2">
            <GrowthProgress value={state.percent} label={`${state.completedCount} dari ${state.totalCount} materi selesai`} />
            <p className="text-sm text-muted-foreground">
              Waktu belajar {formatStudyTime(state.studySeconds)}.{" "}
              {state.enrollment
                ? `Akses penuh lewat ${state.enrollment.productName} sampai ${formatTanggal(state.enrollment.expiresAt)}.`
                : "Kamu bisa membuka bab gratis. Bab lain terbuka setelah berlangganan."}
            </p>
          </div>
          {resume && (
            <Button asChild size="lg">
              <Link href={`/kelas/${outline.slug}/${resume}`}>{state.completedCount ? "Lanjutkan belajar" : "Mulai belajar"}</Link>
            </Button>
          )}
        </div>
      )}
      <CourseOutlineList
        courseSlug={outline.slug}
        courseTitle={outline.title}
        products={outline.products}
        sections={outline.sections.map((s) => ({
          id: s.id,
          title: s.title,
          isFree: s.isFree,
          lessons: s.lessons.map((l) => {
            const st = byLesson.get(l.id)!;
            return { slug: l.slug, title: l.title, type: l.type, durationSec: l.durationSec, access: st.access, completed: st.completed };
          }),
        }))}
      />
    </div>
  );
}

function StateSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Memuat kurikulum">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}

const levelLabels = { MUDAH: "dasar", SEDANG: "menengah", SULIT: "lanjutan" } as const;

// Ringkasan kelas dan kurikulum (G.1, G.4.10–G.4.12, C.5).
export default async function KelasDetailPage({ params }: PageProps<"/kelas/[slug]">) {
  const outline = await getCourseOutline((await params).slug);
  if (!outline) notFound();
  const lessonCount = outline.sections.reduce((n, s) => n + s.lessons.length, 0);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="page-container flex flex-col gap-10 py-10 md:py-14">
      <JsonLd<Course>
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: outline.title,
          description: outline.summary,
          url: `${appUrl}/kelas/${outline.slug}`,
          inLanguage: "id-ID",
          provider: { "@type": "Organization", name: "Taman Pelajar", url: appUrl },
        }}
      />
      <header className="flex max-w-3xl flex-col gap-4">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/kelas" className="hover:text-primary">
                Kelas online
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li>{outline.category.name}</li>
          </ol>
        </nav>
        <h1 className="text-title text-primary">{outline.title}</h1>
        <p className="text-lead">{outline.description}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {outline.sections.length} bab, {lessonCount} materi, video {formatStudyTime(outline.estimatedMinutes * 60)}, tingkat{" "}
          {levelLabels[outline.level]}.
        </p>
      </header>

      <section aria-labelledby="kurikulum-judul" className="flex flex-col gap-5">
        <h2 id="kurikulum-judul" className="text-heading">
          Kurikulum
        </h2>
        <Suspense fallback={<StateSkeleton />}>
          <CourseState outline={outline} />
        </Suspense>
      </section>
    </main>
  );
}
