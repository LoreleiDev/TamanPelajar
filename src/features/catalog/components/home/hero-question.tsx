"use client";

import { CircleCheck, CircleX, Clock, Flag } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { SampleQuestion } from "@/features/catalog/home-sample";
import { cn } from "@/lib/utils";

/**
 * Potongan antarmuka CBT yang bisa dicoba langsung di beranda: pilih jawaban, lihat
 * benar/salah (warna + ikon + teks) dan pembahasannya. Tanpa JavaScript tetap terbaca
 * sebagai soal biasa.
 */
export function HeroQuestion({ questions }: { questions: SampleQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = questions[index];
  const correct = picked === q.answer;

  function next() {
    setIndex((i) => (i + 1) % questions.length);
    setPicked(null);
  }

  return (
    <div
      data-ui
      className="w-full rounded-2xl bg-white text-foreground shadow-lift" // taste-skill-ignore: kartu antarmuka mengambang di atas hero
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 text-sm" /* taste-skill-ignore: data-ui */>
        <div className="min-w-0">
          <p className="truncate font-bold">{q.exam}</p>
          <p className="text-muted-foreground">
            Subtes {q.section}, soal <span className="tabular-nums">{q.number}</span> dari{" "}
            <span className="tabular-nums">{q.total}</span>
          </p>
        </div>
        <p className="flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 font-semibold tabular-nums">
          <Clock aria-hidden="true" className="size-4" />
          <span className="sr-only">Sisa waktu</span>
          {q.remaining}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-5 py-5">
        <p id={`${q.id}-soal`} className="mb-1 text-[1.0625rem] leading-relaxed font-semibold">
          {q.prompt}
        </p>
        <div role="radiogroup" aria-labelledby={`${q.id}-soal`} className="flex flex-col gap-3">
        {q.options.map((o) => {
          const isPicked = picked === o.label;
          const isAnswer = picked !== null && o.label === q.answer;
          return (
            <label
              key={o.label}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-150",
                "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
                isAnswer
                  ? "border-success bg-success/8"
                  : isPicked
                    ? "border-destructive bg-destructive/6"
                    : "border-border hover:border-primary/50 hover:bg-accent",
              )}
            >
              <input
                type="radio"
                name={q.id}
                value={o.label}
                checked={isPicked}
                onChange={() => setPicked(o.label)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-lg text-sm font-bold",
                  isAnswer ? "bg-success text-white" : isPicked ? "bg-destructive text-white" : "bg-secondary",
                )}
              >
                {o.label}
              </span>
              <span className="pt-0.5">{o.text}</span>
            </label>
          );
        })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4" aria-live="polite" /* taste-skill-ignore: data-ui */>
        {picked === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flag aria-hidden="true" className="size-4" />
            Pilih satu jawaban untuk melihat pembahasan.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className={cn("flex items-center gap-2 font-bold", correct ? "text-success" : "text-destructive")}>
              {correct ? (
                <CircleCheck aria-hidden="true" className="size-5" />
              ) : (
                <CircleX aria-hidden="true" className="size-5" />
              )}
              {correct ? "Benar" : `Belum tepat, jawabannya ${q.answer}`}
            </p>
            <p className="text-sm leading-relaxed">{q.explanation}</p>
          </div>
        )}
        <Button variant="outline" className="self-start" onClick={next}>
          Coba soal lain
        </Button>
      </div>
    </div>
  );
}
