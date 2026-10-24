"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { LessonAccess } from "@/lib/access-rules";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

import { LessonStatusIcon } from "./lesson-icon";
import { SubscribeDialog, type SubscribeProduct } from "./subscribe-dialog";

export interface NavLesson {
  slug: string;
  title: string;
  type: string;
  durationSec: number | null;
  access: LessonAccess;
  completed: boolean;
}

/** Sidebar kurikulum (G.1) dengan pencarian materi (G.4.7). */
export function CurriculumNav({
  courseSlug,
  courseTitle,
  currentSlug,
  sections,
  products,
}: {
  courseSlug: string;
  courseTitle: string;
  currentSlug: string;
  sections: { id: string; title: string; isFree: boolean; lessons: NavLesson[] }[];
  products: SubscribeProduct[];
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const words = q.toLocaleLowerCase("id-ID").split(/\s+/).filter(Boolean);
    if (!words.length) return sections;
    return sections
      .map((s) => ({ ...s, lessons: s.lessons.filter((l) => words.every((w) => l.title.toLocaleLowerCase("id-ID").includes(w))) }))
      .filter((s) => s.lessons.length > 0);
  }, [q, sections]);

  return (
    <nav aria-label="Kurikulum kelas" className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor="cari-materi" className="sr-only">
          Cari materi di kelas ini
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="cari-materi" type="search" placeholder="Cari materi" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada materi dengan kata “{q}”.</p>}
      <ol className="flex flex-col gap-4">
        {filtered.map((s) => (
          <li key={s.id} className="flex flex-col gap-1">
            <p className="flex items-center justify-between gap-2 px-2 text-sm font-bold">
              <span>{s.title}</span>
              {s.isFree && <span className="rounded-full bg-leaf/35 px-2 py-0.5 text-[0.75rem] font-semibold">Gratis</span>}
            </p>
            <ul className="flex flex-col">
              {s.lessons.map((l) => {
                const current = l.slug === currentSlug;
                const locked = l.access === "perlu-langganan";
                const body = (
                  <>
                    <LessonStatusIcon type={l.type} access={l.access} completed={l.completed} className="mt-0.5" />
                    <span className="flex-1">{l.title}</span>
                    {l.durationSec ? (
                      <span className="text-[0.8125rem] text-muted-foreground tabular-nums">{formatClock(l.durationSec)}</span>
                    ) : null}
                  </>
                );
                const cls = cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-[0.9375rem] transition-colors duration-150",
                  current ? "bg-accent font-semibold text-primary" : "hover:bg-secondary",
                  (locked || l.access === "terkunci-urutan") && !current && "text-muted-foreground",
                );
                return (
                  <li key={l.slug}>
                    {locked ? (
                      <SubscribeDialog
                        courseTitle={courseTitle}
                        products={products}
                        trigger={
                          <button type="button" className={cls}>
                            {body}
                          </button>
                        }
                      />
                    ) : (
                      <Link href={`/kelas/${courseSlug}/${l.slug}`} aria-current={current ? "page" : undefined} className={cls}>
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
    </nav>
  );
}
