"use client";

import Link from "next/link";

import { useRequireLogin } from "@/components/shared/require-login";
import type { LessonAccess } from "@/lib/access-rules";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

import { LessonStatusIcon } from "./lesson-icon";
import { SubscribeDialog, type SubscribeProduct } from "./subscribe-dialog";

type Lesson = { slug: string; title: string; type: string; durationSec: number | null; access: LessonAccess; completed: boolean };

const rowCls =
  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none";

/**
 * Kurikulum di halaman ringkasan kelas (G.1, G.4.10–G.4.12, C.5.3): tamu diminta masuk,
 * bab berbayar membuka ajakan berlangganan, materi terbuka langsung ditautkan.
 */
export function CourseOutlineList({
  courseSlug,
  courseTitle,
  sections,
  products,
}: {
  courseSlug: string;
  courseTitle: string;
  sections: { id: string; title: string; isFree: boolean; lessons: Lesson[] }[];
  products: SubscribeProduct[];
}) {
  const { requireLogin } = useRequireLogin();

  return (
    <ol className="flex flex-col gap-3">
      {sections.map((s, i) => (
        <li key={s.id} className="overflow-hidden rounded-xl border border-border" /* taste-skill-ignore: kartu bab */>
          <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary px-4 py-3">
            <h3 className="font-bold">
              Bab {i + 1}. {s.title}
            </h3>
            <span className={cn("text-sm font-semibold", s.isFree ? "text-primary" : "text-muted-foreground")}>
              {s.isFree ? "Gratis setelah masuk" : "Untuk pelanggan"}
            </span>
          </div>
          <ul className="flex flex-col p-1.5">
            {s.lessons.map((l) => {
              const body = (
                <>
                  <LessonStatusIcon type={l.type} access={l.access} completed={l.completed} className="mt-0.5" />
                  <span className="flex-1">{l.title}</span>
                  {l.type === "KUIS" ? (
                    <span className="text-sm text-muted-foreground">Kuis</span>
                  ) : l.durationSec ? (
                    <span className="text-sm text-muted-foreground tabular-nums">{formatClock(l.durationSec)}</span>
                  ) : null}
                </>
              );
              return (
                <li key={l.slug}>
                  {l.access === "perlu-masuk" ? (
                    <button
                      type="button"
                      className={rowCls}
                      onClick={() => requireLogin(`Untuk membuka materi “${l.title}”, masuk ke akunmu. Bab 1 dan 2 gratis.`)}
                    >
                      {body}
                    </button>
                  ) : l.access === "perlu-langganan" ? (
                    <SubscribeDialog
                      courseTitle={courseTitle}
                      products={products}
                      trigger={
                        <button type="button" className={cn(rowCls, "text-muted-foreground")}>
                          {body}
                        </button>
                      }
                    />
                  ) : (
                    <Link href={`/kelas/${courseSlug}/${l.slug}`} className={rowCls}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
