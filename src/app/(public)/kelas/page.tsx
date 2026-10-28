import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SaveCourseButton } from "@/components/course/save-course-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listCourses } from "@/features/course/queries";
import { formatStudyTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kelas online",
  description: "Kelas berurutan per bab untuk UTBK/SNBT dan SKD: video, ringkasan, dan kuis. Bab 1 dan 2 setiap kelas gratis setelah masuk.",
  alternates: { canonical: "/kelas" },
};

const levelLabels = { MUDAH: "Dasar", SEDANG: "Menengah", SULIT: "Lanjutan" } as const;

// Daftar kelas online (C.5.1, G).
export default async function KelasPage() {
  const courses = await listCourses();
  return (
    <main className="flex flex-col">
      <PageHeader
        eyebrow="Belajar runtut"
        title="Kelas online"
        description="Materi berurutan per bab dengan video, ringkasan, dan kuis. Bab 1 dan 2 setiap kelas terbuka gratis setelah kamu masuk; bab berikutnya terbuka lewat paket."
      />
      <div className="page-container flex flex-col gap-10 py-10 md:py-12">
      {courses.length === 0 ? (
        <EmptyState
          title="Belum ada kelas yang terbit"
          description="Kelas baru sedang disiapkan. Sementara itu, lihat paket tryout di katalog."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <li key={c.slug} className="flex h-full flex-col rounded-xl border border-border transition-colors duration-150 hover:border-primary/40">
              <Link href={`/kelas/${c.slug}`} className="group flex flex-1 flex-col gap-3 rounded-t-xl p-5 transition-colors duration-150 hover:bg-accent/40">
                <p className="text-sm">
                  <span className="font-semibold text-primary">{c.category.name}</span>
                  <span className="text-muted-foreground">, tingkat {levelLabels[c.level].toLowerCase()}</span>
                </p>
                <h2 className="text-heading group-hover:text-primary">{c.title}</h2>
                <p className="text-muted-foreground">{c.summary}</p>
                <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-2 text-sm tabular-nums">
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Bab</dt>
                    <dd>
                      <span className="font-semibold">{c.sectionCount}</span> bab
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Materi</dt>
                    <dd>
                      <span className="font-semibold">{c.lessonCount}</span> materi
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Durasi video</dt>
                    <dd className="flex items-center gap-1">
                      <BookOpen aria-hidden="true" className="size-4 text-primary" />
                      {formatStudyTime(c.estimatedMinutes * 60)} video
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Bab gratis</dt>
                    <dd className="font-semibold text-primary">{c.freeSectionCount} bab gratis</dd>
                  </div>
                </dl>
              </Link>
              {/* Di luar tautan kartu: tombol tidak boleh berada di dalam elemen <a>. */}
              <div className="rounded-b-xl bg-secondary px-5 py-3">
                <SaveCourseButton courseId={c.id} courseTitle={c.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </main>
  );
}
