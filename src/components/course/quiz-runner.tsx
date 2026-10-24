"use client";

import { CircleCheck, CircleX, MinusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { submitQuiz, type QuizResult } from "@/features/course/actions";
import { cn } from "@/lib/utils";

type Question = { id: string; type: string; body: string; options: { id: string; label: string; body: string }[] };
type Answer = { optionIds?: string[]; textAnswer?: string; numberAnswer?: number };

const statusView = {
  BENAR: { icon: CircleCheck, text: "Benar", cls: "text-success" },
  SALAH: { icon: CircleX, text: "Salah", cls: "text-destructive" },
  KOSONG: { icon: MinusCircle, text: "Tidak dijawab", cls: "text-muted-foreground" },
  MENUNGGU_PENILAIAN: { icon: MinusCircle, text: "Menunggu penilaian", cls: "text-muted-foreground" },
} as const;

/** Kuis setelah materi (G.4.5). Kunci dan pembahasan baru tampil setelah dikumpulkan. */
export function QuizRunner({
  lessonId,
  passingScore,
  questions,
  lastAttempt,
}: {
  lessonId: string;
  passingScore: number;
  questions: Question[];
  lastAttempt: { score: number; passed: boolean } | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (id: string, a: Answer) => setAnswers((prev) => ({ ...prev, [id]: a }));
  const answered = questions.filter((q) => {
    const a = answers[q.id];
    return a && ((a.optionIds?.length ?? 0) > 0 || a.textAnswer?.trim() || a.numberAnswer !== undefined);
  }).length;

  const byId = new Map(result?.questions.map((q) => [q.id, q]));

  return (
    <form
      method="post"
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await submitQuiz({ lessonId, answers });
          if (!r.ok) return void toast.error(r.error);
          setResult(r.data);
          if (r.data.certificate) toast.success("Semua materi selesai. Sertifikatmu sudah terbit.");
          router.refresh();
        });
      }}
    >
      <p className="text-muted-foreground">
        Nilai minimal lulus <span className="font-semibold text-foreground tabular-nums">{passingScore}</span>. Kuis yang lulus
        otomatis menandai materi ini selesai.
        {lastAttempt && !result && (
          <>
            {" "}
            Nilai terakhirmu <span className="font-semibold text-foreground tabular-nums">{lastAttempt.score}</span> (
            {lastAttempt.passed ? "lulus" : "belum lulus"}).
          </>
        )}
      </p>

      <ol className="flex flex-col gap-6">
        {questions.map((q, i) => {
          const r = byId.get(q.id);
          const view = r ? statusView[r.status] : null;
          const multi = q.type === "PG_JAMAK";
          return (
            <li key={q.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <fieldset className="flex flex-col gap-3" disabled={Boolean(result)}>
                <legend className="mb-2 font-semibold leading-relaxed">
                  <span className="tabular-nums">{i + 1}.</span> {q.body}
                  {multi && <span className="block text-sm font-normal text-muted-foreground">Pilih semua jawaban yang benar.</span>}
                </legend>
                {q.options.length > 0 ? (
                  q.options.map((o) => {
                    const picked = answers[q.id]?.optionIds?.includes(o.id) ?? false;
                    const isKey = r?.correctOptionIds.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5",
                          isKey ? "border-success bg-success/8" : picked && r ? "border-destructive bg-destructive/6" : "border-border",
                        )}
                      >
                        <input
                          type={multi ? "checkbox" : "radio"}
                          name={q.id}
                          checked={picked}
                          onChange={(e) => {
                            const prev = answers[q.id]?.optionIds ?? [];
                            set(q.id, {
                              optionIds: multi ? (e.target.checked ? [...prev, o.id] : prev.filter((x) => x !== o.id)) : [o.id],
                            });
                          }}
                          className="mt-1 size-4 accent-primary"
                        />
                        <span>
                          <span className="font-semibold">{o.label}.</span> {o.body}
                          {isKey && <span className="ml-2 text-sm font-semibold text-success">(kunci)</span>}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <input
                    type={q.type === "NUMERIK" ? "number" : "text"}
                    step="any"
                    aria-label={`Jawaban soal ${i + 1}`}
                    onChange={(e) =>
                      set(
                        q.id,
                        q.type === "NUMERIK"
                          ? { numberAnswer: e.target.value === "" ? undefined : Number(e.target.value) }
                          : { textAnswer: e.target.value },
                      )
                    }
                    className="h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-base"
                  />
                )}
              </fieldset>
              {r && view && (
                <div className="flex flex-col gap-1 pt-1">
                  <p className={cn("flex items-center gap-2 font-semibold", view.cls)}>
                    <view.icon className="size-4.5" aria-hidden="true" />
                    {view.text}
                    {r.status !== "BENAR" && r.correctText && <span className="text-foreground">: jawaban benar {r.correctText}</span>}
                  </p>
                  <p className="text-sm leading-relaxed">{r.explanation}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {result ? (
        <div className="flex flex-col gap-3 rounded-xl bg-accent p-4" role="status">
          <p className="text-lg font-bold">
            Nilai kuis <span className="tabular-nums">{result.score}</span>, {result.passed ? "lulus" : "belum lulus"}.
          </p>
          <Button
            type="button"
            variant="outline"
            className="self-start bg-background"
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            Ulangi kuis
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Menilai…" : "Kumpulkan jawaban"}
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {answered} dari {questions.length} soal dijawab
          </span>
        </div>
      )}
    </form>
  );
}
