"use client";

import { useEffect, useRef, useState } from "react";

import { saveNote } from "@/features/course/actions";

type Status = "tersimpan" | "mengetik" | "menyimpan" | "gagal";

const labels: Record<Status, string> = {
  tersimpan: "Tersimpan",
  mengetik: "Belum tersimpan",
  menyimpan: "Menyimpan…",
  gagal: "Gagal menyimpan. Periksa koneksi lalu ketik lagi.",
};

/** Catatan pribadi per materi (G.2.6), tersimpan otomatis 1,5 detik setelah berhenti mengetik. */
export function NoteEditor({ lessonId, initial }: { lessonId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<Status>("tersimpan");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(next: string) {
    setValue(next);
    setStatus("mengetik");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("menyimpan");
      const r = await saveNote({ lessonId, content: next });
      setStatus(r.ok ? "tersimpan" : "gagal");
    }, 1500);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="catatan" className="sr-only">
        Catatan pribadi untuk materi ini
      </label>
      <textarea
        id="catatan"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={5000}
        rows={6}
        placeholder="Tulis ringkasan dengan kata-katamu sendiri. Hanya kamu yang bisa membaca catatan ini."
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <p className="flex justify-between text-sm text-muted-foreground" aria-live="polite">
        <span className={status === "gagal" ? "text-destructive" : undefined}>{labels[status]}</span>
        <span className="tabular-nums">{value.length}/5.000</span>
      </p>
    </div>
  );
}
