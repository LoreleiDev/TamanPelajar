import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
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
    <main className="page-container flex flex-col gap-10 py-12 md:py-16">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-title text-primary">Kelas online</h1>
        <p className="text-lead">
          Materi berurutan per bab dengan video, ringkasan, dan kuis. Bab 1 dan 2 setiap kelas terbuka gratis setelah kamu
          masuk; bab berikutnya terbuka lewat paket.
        </p>
      </header>
      {courses.length === 0 ? (
        <EmptyState
          title="Belum ada kelas yang terbit"
          description="Kelas baru sedang disiapkan. Sementara itu, lihat paket tryout di katalog."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/kelas/${c.slug}`}
                className="group flex h-full flex-col gap-3 rounded-xl border border-border p-5 transition-colors duration-150 hover:border-primary/40 hover:bg-accent/40"
              >
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
