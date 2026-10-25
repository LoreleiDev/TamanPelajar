"use client";

import { CircleCheck, CircleX, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nilaiTugasPraktik } from "@/features/admin/practical-actions";
import { confirmAlert } from "@/lib/alert";

type Decision = "SETUJUI" | "REVISI" | "TOLAK";

const confirmText: Record<Decision, { title: string; text: string; label: string }> = {
  SETUJUI: { title: "Setujui tugas ini?", text: "Sertifikat langsung terbit dan siswa diberi tahu lewat notifikasi dan email.", label: "Ya, setujui" },
  REVISI: { title: "Minta revisi?", text: "Siswa bisa mengirim ulang sekali sebelum batch berakhir.", label: "Minta revisi" },
  TOLAK: { title: "Tolak tugas ini?", text: "Siswa dinyatakan belum lulus di batch ini dan bisa mengulang gratis di batch berikutnya.", label: "Ya, tolak" },
};

/** Penilaian tugas praktik: catatan untuk siswa lalu setujui, minta revisi (sekali), atau tolak. */
export function PracticalReviewForm({ submissionId, canRevise }: { submissionId: string; canRevise: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const noteId = `catatan-${submissionId}`;

  const decide = async (decision: Decision) => {
    if (decision !== "SETUJUI" && note.trim().length < 5) {
      setError("Tulis alasan minimal 5 karakter agar siswa tahu yang perlu diperbaiki.");
      return;
    }
    setError(undefined);
    const c = confirmText[decision];
    if (!(await confirmAlert({ title: c.title, text: c.text, confirmLabel: c.label, destructive: decision === "TOLAK" }))) return;
    start(async () => {
      const r = await nilaiTugasPraktik({ submissionId, decision, note });
      if (!r.ok) {
        setError(r.fieldErrors?.note ?? r.error);
        return;
      }
      toast.success(decision === "SETUJUI" ? "Tugas disetujui. Sertifikat terbit." : decision === "REVISI" ? "Revisi diminta." : "Tugas ditolak.");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className="font-semibold">
          Catatan untuk siswa
        </label>
        <Textarea
          id={noteId}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          aria-invalid={Boolean(error)}
          aria-describedby={`${noteId}-hint${error ? ` ${noteId}-error` : ""}`}
        />
        <p id={`${noteId}-hint`} className="text-sm text-muted-foreground">
          Wajib untuk revisi dan penolakan. Catatan ikut dikirim di notifikasi dan email.
        </p>
        {error && (
          <p id={`${noteId}-error`} role="alert" className="text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => void decide("SETUJUI")}>
          <CircleCheck data-icon="inline-start" aria-hidden="true" />
          Setujui
        </Button>
        {canRevise && (
          <Button type="button" variant="outline" disabled={pending} onClick={() => void decide("REVISI")}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Minta revisi
          </Button>
        )}
        <Button type="button" variant="outline" disabled={pending} className="text-destructive hover:text-destructive" onClick={() => void decide("TOLAK")}>
          <CircleX data-icon="inline-start" aria-hidden="true" />
          Tolak
        </Button>
      </div>
    </div>
  );
}
