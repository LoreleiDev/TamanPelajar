"use client";

import { FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/components/form-parts";
import { imporSoal, type ImportReport } from "@/features/admin/questions/actions";

/** Impor CSV/XLSX dua langkah (M.5.2): periksa dulu, lalu simpan baris yang valid. */
export function QuestionImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>();
  const [report, setReport] = useState<ImportReport>();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const send = (mode: "periksa" | "impor") =>
    start(async () => {
      setError(undefined);
      const file = fileRef.current?.files?.[0];
      if (!file) return setError("Pilih file CSV atau XLSX lebih dulu.");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      const r = await imporSoal(fd);
      if (!r.ok) return setError(r.error);
      setReport(r.data);
      if (r.data.mode === "impor") {
        toast.success(`${r.data.imported} soal diimpor.`);
        router.refresh();
      }
    });

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <FormAlert message={error} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="file-impor" className="font-semibold">
          File soal
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            id="file-impor"
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            aria-describedby="file-impor-hint"
            onChange={(e) => {
              setFileName(e.target.files?.[0]?.name);
              setReport(undefined);
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet data-icon="inline-start" />
            {fileName ? "Ganti file" : "Pilih file"}
          </Button>
          {fileName && <span className="text-sm break-all">{fileName}</span>}
        </div>
        <span id="file-impor-hint" className="text-sm text-muted-foreground">
          CSV (UTF-8, pemisah koma atau titik koma) atau XLSX, maks. 2 MB dan 500 soal.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending || !fileName} onClick={() => send("periksa")}>
          {pending ? "Memproses…" : "Periksa file"}
        </Button>
        <Button type="button" disabled={pending || !report || report.valid === 0 || report.mode === "impor"} onClick={() => send("impor")}>
          {report && report.valid > 0 && report.mode === "periksa" ? `Impor ${report.valid} soal valid` : "Impor"}
        </Button>
      </div>

      {report && (
        <section aria-labelledby="hasil-periksa" role="status" className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <h2 id="hasil-periksa" className="font-bold">
            {report.mode === "impor" ? `${report.imported} soal berhasil diimpor` : `${report.valid} soal valid, ${report.errors.length} baris bermasalah`}
          </h2>
          {report.errors.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {report.mode === "impor" ? "Baris berikut dilewati. Perbaiki lalu impor file berisi baris itu saja." : "Baris bermasalah akan dilewati saat impor."}
              </p>
              <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto text-sm">
                {report.errors.map((e) => (
                  <li key={`${e.row}-${e.message}`}>
                    <span className="font-semibold tabular-nums">Baris {e.row}:</span> {e.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
