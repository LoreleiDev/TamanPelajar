"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nilaiEssay } from "@/features/admin/grading-actions";

/** Input nilai satu jawaban essay (L.2.7). */
export function GradeForm({ answerId, maxScore, current }: { answerId: string; maxScore: number; current: number | null }) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(current === null ? "" : String(current).replace(".", ","));
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const max = String(maxScore).replace(".", ",");

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(undefined);
          const r = await nilaiEssay({ answerId, score: value });
          if (!r.ok) return setError(r.fieldErrors?.score ?? r.error);
          toast.success(r.data.pending ? `Nilai disimpan. ${r.data.pending} essay lain di percobaan ini belum dinilai.` : "Nilai disimpan dan hasil siswa diperbarui.");
          router.refresh();
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-semibold">
          Nilai (0–{max})
        </label>
        <Input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 tabular-nums"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      <Button type="submit" disabled={pending || value.trim() === ""}>
        {pending ? "Menyimpan…" : current === null ? "Simpan nilai" : "Ubah nilai"}
      </Button>
      {error && (
        <p id={`${id}-error`} role="alert" className="w-full text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
