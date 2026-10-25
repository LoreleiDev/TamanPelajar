import { CircleCheck } from "lucide-react";

import { difficultyLabel, questionTypeLabel, type QuestionTypeCode } from "@/features/admin/questions/schemas";
import { sanitizeRichText } from "@/lib/sanitize";

export interface PreviewQuestion {
  type: QuestionTypeCode;
  body: string;
  imageUrl: string | null;
  topic: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  weight: number;
  options: { id: string; label: string; body: string; isCorrect: boolean; score: number | null }[];
  correctText: string | null;
  correctNumber: number | null;
  tolerance: number | null;
  explanation: string;
  explanationVideoUrl: string | null;
}

const num = (n: number) => String(n).replace(".", ",");

/**
 * Pratinjau soal seperti tampil di halaman ujian, ditambah kunci dan pembahasan (M.5.4,
 * M.6.9). Kunci ditandai dengan ikon dan teks, bukan warna saja.
 */
export function QuestionPreview({ q, number }: { q: PreviewQuestion; number?: number }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {number !== undefined && <span className="text-base font-bold text-foreground">Soal {number}</span>}
        <span>{questionTypeLabel[q.type]}</span>
        <span>· {q.topic}</span>
        <span>· {difficultyLabel[q.difficulty]}</span>
        <span>· bobot {num(q.weight)}</span>
      </header>
      <div className="rich-text max-w-[75ch] text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeRichText(q.body) }} />
      {q.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- gambar Cloudinary dengan transformasi otomatis
        <img src={q.imageUrl} alt="Gambar soal" className="max-h-80 w-auto self-start rounded-lg border border-border" />
      )}
      {q.options.length > 0 && (
        <ol className="flex flex-col gap-2">
          {q.options.map((o) => (
            <li
              key={o.id}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${o.isCorrect ? "border-success bg-success/8" : "border-border"}`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-sm font-bold">{o.label}</span>
              <span className="rich-text min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: sanitizeRichText(o.body) }} />
              {o.score !== null && <span className="shrink-0 text-sm font-semibold tabular-nums">skor {num(o.score)}</span>}
              {o.isCorrect && (
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-success">
                  <CircleCheck aria-hidden="true" className="size-4" />
                  {o.score !== null ? "Skor tertinggi" : "Kunci"}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
      {q.type === "ISIAN_SINGKAT" && (
        <p>
          <span className="font-semibold">Kunci:</span> {(q.correctText ?? "").split("|").join(" atau ")}
        </p>
      )}
      {q.type === "NUMERIK" && (
        <p className="tabular-nums">
          <span className="font-semibold">Kunci:</span> {q.correctNumber === null ? "–" : num(q.correctNumber)}
          {q.tolerance ? ` (toleransi ±${num(q.tolerance)})` : ""}
        </p>
      )}
      {q.type === "ESSAY" && <p className="text-muted-foreground">Essay dinilai admin dari menu Penilaian.</p>}
      <details className="rounded-lg bg-secondary px-4 py-3">
        <summary className="cursor-pointer font-semibold">Pembahasan</summary>
        <div className="rich-text mt-2 max-w-[75ch] leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeRichText(q.explanation) }} />
        {q.explanationVideoUrl && (
          <a href={q.explanationVideoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-primary underline underline-offset-4">
            Buka video pembahasan
          </a>
        )}
      </details>
    </article>
  );
}
