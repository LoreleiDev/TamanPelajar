import { ChevronDown, Lock, PlayCircle } from "lucide-react";

import type { IncludedCourse } from "@/features/catalog/types";

/**
 * Silabus (D.3.5) per kelas. Bab gratis diberi label teks, bab berbayar diberi ikon
 * gembok (G.4.10–G.4.12); status tidak hanya dibedakan dengan warna.
 */
export function Syllabus({ courses }: { courses: IncludedCourse[] }) {
  return (
    <div className="flex flex-col gap-3">
      {courses.map((course, i) => (
        <details key={course.slug} open={i === 0} className="group rounded-xl border border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-4 hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40 md:px-5 [&::-webkit-details-marker]:hidden">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-lg font-bold">{course.title}</h3>
              <p className="text-sm text-muted-foreground tabular-nums">
                {course.sections.length} bab, {course.lessonCount} materi, {course.videoCount} video
              </p>
            </div>
            <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform duration-150 group-open:rotate-180" />
          </summary>
          <ol className="flex flex-col gap-5 px-4 pt-1 pb-5 md:px-5">
            {course.sections.map((section, s) => (
              <li key={section.title} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold">
                    Bab {s + 1}. {section.title}
                  </h4>
                  {section.isFree ? (
                    <span className="rounded-full bg-leaf/35 px-2 py-0.5 text-[0.8125rem] font-semibold text-foreground">
                      Gratis setelah masuk
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[0.8125rem] text-muted-foreground">
                      <Lock aria-hidden="true" className="size-3.5" />
                      Terbuka setelah berlangganan
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-1.5 pl-1">
                  {section.lessons.map((lesson) => (
                    <li key={lesson} className="flex items-center gap-2 text-[0.9375rem]">
                      {section.isFree ? (
                        <PlayCircle aria-hidden="true" className="size-4 shrink-0 text-primary" />
                      ) : (
                        <Lock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      {lesson}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  );
}
