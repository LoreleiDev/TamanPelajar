"use client";

import { Check, Flag, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

export type QuestionStatus = "belum" | "dijawab" | "ragu";

export interface PaletteSection {
  id: string;
  title: string;
  state: "aktif" | "selesai" | "belum-dibuka";
  questions: { id: string; number: number; status: QuestionStatus }[];
}

const statusText: Record<QuestionStatus, string> = { belum: "belum dijawab", dijawab: "sudah dijawab", ragu: "ragu-ragu" };

/** Panel daftar soal (I.3.4): status dibedakan warna dan ikon, klik nomor untuk pindah. */
export function QuestionPalette({
  sections,
  currentId,
  onSelect,
}: {
  sections: PaletteSection[];
  currentId: string;
  onSelect: (questionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {sections.map((s) => (
        <section key={s.id} aria-labelledby={`palet-${s.id}`} className="flex flex-col gap-2.5">
          <h3 id={`palet-${s.id}`} className="flex items-center justify-between gap-2 text-sm font-bold">
            <span>{s.title}</span>
            <span className="font-semibold text-muted-foreground">
              {s.state === "selesai" ? "Ditutup" : s.state === "belum-dibuka" ? "Belum dibuka" : "Berjalan"}
            </span>
          </h3>
          <ol className="grid grid-cols-5 gap-2">
            {s.questions.map((q) => {
              const active = q.id === currentId;
              const locked = s.state !== "aktif";
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onSelect(q.id)}
                    aria-current={active ? "step" : undefined}
                    aria-label={`Soal ${q.number}, ${statusText[q.status]}${locked ? ", subtes tidak aktif" : ""}`}
                    className={cn(
                      "relative grid h-11 w-full place-items-center rounded-lg border-2 text-base font-bold tabular-nums transition-colors duration-150",
                      "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      q.status === "dijawab" && "border-primary bg-primary text-primary-foreground",
                      q.status === "ragu" && "border-warning bg-warning/12 text-foreground",
                      q.status === "belum" && "border-border bg-background text-foreground hover:border-primary/60",
                      active && "ring-3 ring-foreground ring-offset-2",
                      locked && "cursor-not-allowed opacity-45 hover:border-border",
                    )}
                  >
                    {q.number}
                    {q.status === "dijawab" && <Check aria-hidden="true" className="absolute top-0.5 right-0.5 size-3" strokeWidth={3} />}
                    {q.status === "ragu" && <Flag aria-hidden="true" className="absolute top-0.5 right-0.5 size-3 text-warning" strokeWidth={3} />}
                    {locked && q.status === "belum" && <Lock aria-hidden="true" className="absolute top-0.5 right-0.5 size-3" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm" aria-label="Keterangan warna">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="grid size-5 place-items-center rounded bg-primary text-primary-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
          Sudah dijawab
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="grid size-5 place-items-center rounded border-2 border-warning bg-warning/12">
            <Flag className="size-3 text-warning" strokeWidth={3} />
          </span>
          Ragu-ragu
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-5 rounded border-2 border-border" />
          Belum dijawab
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-5 rounded border-2 border-border ring-2 ring-foreground ring-offset-1" />
          Soal aktif
        </li>
      </ul>
    </div>
  );
}
