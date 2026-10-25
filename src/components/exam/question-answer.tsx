"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import type { ExamSessionAnswer, ExamSessionQuestion } from "@/features/exam/queries";
import { cn } from "@/lib/utils";

export type AnswerValue = Pick<ExamSessionAnswer, "optionIds" | "textAnswer" | "numberAnswer">;

export const EMPTY_ANSWER: AnswerValue = { optionIds: null, textAnswer: null, numberAnswer: null };

export function isAnswered(a: AnswerValue | undefined) {
  if (!a) return false;
  return (a.optionIds?.length ?? 0) > 0 || Boolean(a.textAnswer?.trim()) || (a.numberAnswer !== null && a.numberAnswer !== undefined);
}

/** Isian angka: koma desimal Indonesia diterima. */
function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (s === "" || s === "-" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Input jawaban untuk enam jenis soal (I.3.3, I.5.1–I.5.6). Opsi tampil sebagai kartu. */
export function QuestionAnswer({
  question,
  value,
  onChange,
}: {
  question: ExamSessionQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
}) {
  const [numberDraft, setNumberDraft] = useState(value.numberAnswer !== null ? String(value.numberAnswer).replace(".", ",") : "");
  const inputId = `jawaban-${question.id}`;

  if (question.type === "PG_TUNGGAL" || question.type === "PG_JAMAK" || question.type === "BENAR_SALAH") {
    const multi = question.type === "PG_JAMAK";
    const picked = new Set(value.optionIds ?? []);
    return (
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Pilihan jawaban soal {question.number}</legend>
        {multi && <p className="text-base font-semibold">Pilih semua jawaban yang benar.</p>}
        {question.options.map((o) => {
          const checked = picked.has(o.id);
          return (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-start gap-4 rounded-xl border-2 px-4 py-3.5 transition-colors duration-150",
                "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                checked ? "border-primary bg-accent" : "border-border hover:border-primary/50",
              )}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={`opsi-${question.id}`}
                value={o.id}
                checked={checked}
                onChange={(e) => {
                  const next = multi
                    ? e.target.checked
                      ? [...picked, o.id]
                      : [...picked].filter((x) => x !== o.id)
                    : [o.id];
                  onChange({ ...EMPTY_ANSWER, optionIds: next.length ? next : null });
                }}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-8 shrink-0 place-items-center font-bold",
                  multi ? "rounded-md" : "rounded-full",
                  checked ? "bg-primary text-primary-foreground" : "border-2 border-border",
                )}
              >
                {checked && multi ? <Check className="size-4.5" /> : o.label}
              </span>
              <span className="flex min-w-0 flex-col gap-2 pt-0.5 text-lg leading-relaxed">
                <span className="sr-only">{o.label}. </span>
                <span className="rich-text" dangerouslySetInnerHTML={{ __html: o.bodyHtml }} />
                {o.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- gambar opsi dari Cloudinary, ukuran bebas
                  <img src={o.imageUrl} alt={`Gambar pilihan ${o.label}`} className="max-h-48 w-auto rounded-lg" />
                )}
              </span>
            </label>
          );
        })}
      </fieldset>
    );
  }

  if (question.type === "NUMERIK") {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="font-semibold">
          Jawaban berupa angka
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={numberDraft}
          onChange={(e) => {
            setNumberDraft(e.target.value);
            onChange({ ...EMPTY_ANSWER, numberAnswer: parseNumber(e.target.value) });
          }}
          aria-describedby={`${inputId}-hint`}
          className="h-12 w-full max-w-xs rounded-lg border-2 border-input bg-background px-4 text-lg tabular-nums focus-visible:border-primary focus-visible:outline-none"
        />
        <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">
          Gunakan koma untuk desimal, misalnya 2,5.
          {numberDraft.trim() !== "" && parseNumber(numberDraft) === null && (
            <span className="block font-semibold text-destructive" role="alert">
              Isian ini bukan angka, jadi belum dihitung sebagai jawaban.
            </span>
          )}
        </p>
      </div>
    );
  }

  if (question.type === "ESSAY") {
    const text = value.textAnswer ?? "";
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="font-semibold">
          Jawaban uraian
        </label>
        <textarea
          id={inputId}
          rows={8}
          maxLength={10_000}
          value={text}
          onChange={(e) => onChange({ ...EMPTY_ANSWER, textAnswer: e.target.value })}
          aria-describedby={`${inputId}-hint`}
          className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-lg leading-relaxed focus-visible:border-primary focus-visible:outline-none"
        />
        <p id={`${inputId}-hint`} className="text-sm text-muted-foreground tabular-nums">
          Dinilai admin setelah tryout selesai. {text.length.toLocaleString("id-ID")}/10.000 karakter.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="font-semibold">
        Jawaban singkat
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        maxLength={200}
        value={value.textAnswer ?? ""}
        onChange={(e) => onChange({ ...EMPTY_ANSWER, textAnswer: e.target.value })}
        className="h-12 w-full max-w-md rounded-lg border-2 border-input bg-background px-4 text-lg focus-visible:border-primary focus-visible:outline-none"
      />
      <p className="text-sm text-muted-foreground">Huruf besar dan kecil tidak dibedakan.</p>
    </div>
  );
}
