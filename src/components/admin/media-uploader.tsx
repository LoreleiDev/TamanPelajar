"use client";

import { FileText, ImageUp, LoaderCircle, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IMAGE_FORMATS, MAX_IMAGE_BYTES, MAX_PDF_BYTES, uploadRejection, type MediaFolder } from "@/features/admin/media";
import { simpanMedia } from "@/features/admin/media-actions";

export interface MediaValue {
  id: string;
  /** URL pratinjau gambar; null untuk PDF. */
  url: string | null;
  name?: string;
}

/**
 * Unggah langsung ke Cloudinary dengan signature dari server (CLAUDE.md "Penyimpanan file").
 * Tipe dan ukuran dicek di browser untuk umpan balik cepat, lalu dicek ulang di server.
 */
export function MediaUploader({
  label,
  folder,
  kind,
  value,
  onChange,
  hint,
}: {
  label: string;
  folder: MediaFolder;
  kind: "image" | "pdf";
  value: MediaValue | null;
  onChange: (value: MediaValue | null) => void;
  hint?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  async function upload(file: File) {
    setError(undefined);
    const format = (file.name.split(".").pop() ?? "").toLowerCase();
    const req = { folder, kind, format, bytes: file.size };
    const rejected = uploadRejection(req);
    if (rejected) return setError(rejected);

    setProgress(0);
    try {
      const res = await fetch("/api/upload/signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
      const sig = await res.json();
      if (!res.ok) throw new Error(sig.error ?? "Gagal menyiapkan upload.");

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      if (sig.type === "authenticated") form.append("type", "authenticated");

      const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`);
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => {
          const body = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) resolve(body);
          else reject(new Error(body.error?.message ? `Cloudinary menolak file: ${body.error.message}` : "Upload gagal."));
        };
        xhr.onerror = () => reject(new Error("Koneksi terputus saat mengunggah. Coba lagi."));
        xhr.send(form);
      });

      const saved = await simpanMedia({ ...result, folder });
      if (!saved.ok) throw new Error(saved.error);
      onChange({ id: saved.data.id, url: saved.data.url, name: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const accept = kind === "image" ? IMAGE_FORMATS.map((f) => `.${f}`).join(",") : ".pdf,application/pdf";
  const limit = kind === "image" ? `JPG, PNG, WEBP, atau GIF, maks. ${MAX_IMAGE_BYTES / 1024 / 1024} MB` : `PDF, maks. ${MAX_PDF_BYTES / 1024 / 1024} MB`;

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="font-semibold">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-2 pr-3">
            {value.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- pratinjau URL Cloudinary dinamis
              <img src={value.url} alt="" className="h-14 w-20 rounded-md object-cover" />
            ) : (
              <FileText aria-hidden="true" className="size-6 text-primary" />
            )}
            <span className="max-w-48 truncate text-sm">{value.name ?? (kind === "image" ? "Gambar tersimpan" : "PDF tersimpan")}</span>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Hapus ${label.toLowerCase()}`}
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button type="button" variant="outline" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
          {progress !== null ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ImageUp data-icon="inline-start" />}
          {progress !== null ? `Mengunggah ${progress}%` : value ? "Ganti file" : "Pilih file"}
        </Button>
      </div>
      <span id={`${id}-hint`} className="text-sm text-muted-foreground">
        {hint ? `${hint} ` : ""}
        {limit}.
      </span>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
