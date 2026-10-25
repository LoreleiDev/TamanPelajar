"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { kirimTugasPraktik } from "@/features/certificate/actions";
import { submitPracticalSchema } from "@/features/certificate/schemas";

/** Form kirim link Google Drive tugas praktik (revisi RMED). */
export function PracticalSubmitForm({ courseId, isRevision }: { courseId: string; isRevision: boolean }) {
  const router = useRouter();
  const [driveUrl, setDriveUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const urlId = `tugas-url-${courseId}`;
  const noteId = `tugas-catatan-${courseId}`;

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = submitPracticalSchema.safeParse({ courseId, driveUrl, note });
        if (!parsed.success) return setError(parsed.error.issues[0]?.message);
        setError(undefined);
        start(async () => {
          const r = await kirimTugasPraktik({ courseId, driveUrl, note });
          if (!r.ok) {
            setError(r.fieldErrors?.driveUrl ?? r.error);
            return;
          }
          toast.success("Tugas praktik terkirim. Admin akan menilainya.");
          router.refresh();
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={urlId} className="font-semibold">
          Link Google Drive tugas
        </label>
        <Input
          id={urlId}
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/…"
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${urlId}-hint${error ? ` ${urlId}-error` : ""}`}
        />
        <p id={`${urlId}-hint`} className="text-sm text-muted-foreground">
          Atur akses link menjadi &ldquo;Siapa saja yang memiliki link&rdquo; agar admin bisa membukanya.
        </p>
        {error && (
          <p id={`${urlId}-error`} role="alert" className="text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className="font-semibold">
          Catatan untuk admin <span className="font-normal text-muted-foreground">(opsional)</span>
        </label>
        <Textarea id={noteId} rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        <Send data-icon="inline-start" aria-hidden="true" />
        {pending ? "Mengirim…" : isRevision ? "Kirim revisi" : "Kirim tugas praktik"}
      </Button>
    </form>
  );
}
