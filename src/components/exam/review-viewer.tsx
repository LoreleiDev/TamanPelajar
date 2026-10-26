"use client";

import { ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock, MinusCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Review, ReviewQuestion, ReviewStatus } from "@/features/exam/results";
import { cn } from "@/lib/utils";

// Pembahasan (I.7). Status benar/salah selalu disertai ikon dan teks, bukan warna saja (I.7.3).
const statusView: Record<ReviewStatus, { icon: typeof CircleCheck; text: string; tone: string; box: string }> = {
  BENAR: { icon: CircleCheck, text: "Benar", tone: "text-success", box: "border-success bg-success/10" },
  SALAH: { icon: CircleX, text: "Salah", tone: "text-destructive", box: "border-destructive bg-destructive/8" },
  KOSONG: { icon: MinusCircle, text: "Tidak dijawab", tone: "text-muted-foreground", box: "border-border bg-background" },
  MENUNGGU_PENILAIAN: { icon: Clock, text: "Menunggu penilaian", tone: "text-warning", box: "border-warning bg-warning/10" },
};
const difficultyLabel = { MUDAH: "mudah", SEDANG: "sedang", SULIT: "sulit" } as const;

function videoEmbed(url: string) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/)?.[1];
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?rel=0`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;
  return null;
}

function OptionRow({ o, multi }: { o: ReviewQuestion["options"][number]; multi: boolean }) {
  const wrongPick = o.picked && !o.isCorrect;
  return (
    <li
      className={cn(
        "flex items-start gap-4 rounded-xl border-2 px-4 py-3",
        o.isCorrect ? "border-success bg-success/8" : wrongPick ? "border-destructive bg-destructive/6" : "border-border",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 shrink-0 place-items-center font-bold",
          multi ? "rounded-md" : "rounded-full",
          o.isCorrect ? "bg-success text-white" : wrongPick ? "bg-destructive text-white" : "border-2 border-border",
        )}
      >
        {o.label}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <span className="sr-only">{o.label}. </span>
        <span className="rich-text text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: o.bodyHtml }} />
        <span className="flex flex-wrap gap-x-4 text-sm font-semibold">
          {o.isCorrect && (
            <span className="inline-flex items-center gap-1 text-success">
              <CircleCheck aria-hidden="true" className="size-4" /> Kunci jawaban
            </span>
          )}
          {o.picked && (
            <span className={cn("inline-flex items-center gap-1", o.isCorrect ? "text-success" : "text-destructive")}>
              {o.isCorrect ? <CircleCheck aria-hidden="true" className="size-4" /> : <CircleX aria-hidden="true" className="size-4" />}
              Jawabanmu
            </span>
          )}
        </span>
      </span>
    </li>
  );
}

export function ReviewViewer({ review, initialNumber }: { review: Review; initialNumber: number }) {
  const [index, setIndex] = useState(() => Math.min(Math.max(initialNumber - 1, 0), review.questions.length - 1));
  const q = review.questions[index];
  const view = statusView[q.status];
  const embed = q.explanationVideoUrl ? videoEmbed(q.explanationVideoUrl) : null;

  const go = (i: number) => {
    setIndex(i);
    window.history.replaceState(null, "", `?soal=${i + 1}`);
    document.getElementById("pembahasan-soal")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  };

  const counts = (["BENAR", "SALAH", "KOSONG", "MENUNGGU_PENILAIAN"] as const).map((s) => ({
    s,
    n: review.questions.filter((x) => x.status === s).length,
  }));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <article className="flex min-w-0 flex-col gap-6" aria-labelledby="pembahasan-soal">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="pembahasan-soal" tabIndex={-1} className="text-2xl font-bold tabular-nums focus:outline-none">
            Soal {q.number}
          </h2>
          <p className="text-sm text-muted-foreground">
            {q.sectionTitle} · {q.subject} · topik {q.topic} · tingkat {difficultyLabel[q.difficulty]}
          </p>
        </div>

        <p className={cn("flex items-center gap-2 self-start rounded-lg border-2 px-3 py-1.5 font-bold", view.box, view.tone)}>
          <view.icon aria-hidden="true" className="size-5" />
          {view.text}
          {q.score !== null && q.status !== "KOSONG" && (
            <span className="font-semibold text-foreground tabular-nums">({q.score > 0 ? "+" : ""}{String(q.score).replace(".", ",")} poin)</span>
          )}
        </p>

        <div className="rich-text max-w-[75ch] text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: q.bodyHtml }} />
        {q.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- gambar soal dari Cloudinary, ukuran bebas
          <img src={q.imageUrl} alt={`Gambar soal ${q.number}`} className="max-h-96 w-auto max-w-full rounded-lg border border-border" />
        )}

        {q.options.length > 0 ? (
          <ul className="flex flex-col gap-3" aria-label="Pilihan jawaban">
            {q.options.map((o) => (
              <OptionRow key={o.id} o={o} multi={q.type === "PG_JAMAK"} />
            ))}
          </ul>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className={cn("flex flex-col gap-1 rounded-xl border-2 px-4 py-3", view.box)}>
              <dt className="text-sm font-semibold">Jawabanmu</dt>
              <dd className="text-lg whitespace-pre-line">{q.answerText ?? <span className="text-muted-foreground">Tidak dijawab</span>}</dd>
            </div>
            {q.correctText && (
              <div className="flex flex-col gap-1 rounded-xl border-2 border-success bg-success/8 px-4 py-3">
                <dt className="text-sm font-semibold">Jawaban benar</dt>
                <dd className="text-lg tabular-nums">{q.correctText}</dd>
              </div>
            )}
          </dl>
        )}

        <section aria-labelledby="penjelasan-judul" className="flex flex-col gap-3 rounded-xl bg-secondary p-5">
          <h3 id="penjelasan-judul" className="text-lg font-bold">
            Pembahasan
          </h3>
          <div className="rich-text max-w-[75ch] leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanationHtml }} />
          {q.explanationVideoUrl &&
            (embed ? (
              <iframe
                src={embed}
                title={`Video pembahasan soal ${q.number}`}
                className="aspect-video w-full max-w-2xl rounded-lg"
                allow="encrypted-media; picture-in-picture; fullscreen"
                loading="lazy"
              />
            ) : (
              <a href={q.explanationVideoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                Tonton video pembahasan
              </a>
            ))}
        </section>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={index === 0} onClick={() => go(index - 1)}>
            <ChevronLeft aria-hidden="true" data-icon="inline-start" />
            Soal sebelumnya
          </Button>
          <Button variant="outline" disabled={index === review.questions.length - 1} onClick={() => go(index + 1)}>
            Soal berikutnya
            <ChevronRight aria-hidden="true" data-icon="inline-end" />
          </Button>
        </div>
      </article>

      {/* Navigasi seluruh nomor soal (I.7.8) */}
      <aside aria-labelledby="nomor-judul" className="flex flex-col gap-4 self-start lg:sticky lg:top-24">
        <h2 id="nomor-judul" className="font-bold">
          Semua soal
        </h2>
        <ol className="grid grid-cols-5 gap-2">
          {review.questions.map((x, i) => {
            const v = statusView[x.status];
            return (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`Soal ${x.number}, ${v.text.toLowerCase()}`}
                  className={cn(
                    "relative grid h-11 w-full place-items-center rounded-lg border-2 font-bold tabular-nums transition-colors duration-150",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    v.box,
                    i === index && "ring-3 ring-foreground ring-offset-2",
                  )}
                >
                  {x.number}
                  <v.icon aria-hidden="true" className={cn("absolute top-0.5 right-0.5 size-3", v.tone)} strokeWidth={3} />
                </button>
              </li>
            );
          })}
        </ol>
        <ul className="flex flex-col gap-1.5 text-sm" aria-label="Ringkasan status">
          {counts
            .filter((c) => c.n > 0)
            .map(({ s, n }) => {
              const v = statusView[s];
              return (
                <li key={s} className="flex items-center gap-2 tabular-nums">
                  <v.icon aria-hidden="true" className={cn("size-4", v.tone)} />
                  {v.text}: <strong>{n}</strong>
                </li>
              );
            })}
        </ul>
      </aside>
    </div>
  );
}
