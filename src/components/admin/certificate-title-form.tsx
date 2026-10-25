"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ubahJudulSertifikat } from "@/features/admin/site-actions";

/** Ubah judul yang tercetak di sertifikat. */
export function CertificateTitleForm({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [value, setValue] = useState(title);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await ubahJudulSertifikat({ id, title: value });
          if (!r.ok) return void toast.error(r.fieldErrors?.title ?? r.error);
          toast.success("Judul sertifikat disimpan.");
          router.refresh();
        });
      }}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-1">
        <label htmlFor={`judul-${id}`} className="text-sm font-semibold">
          Judul di sertifikat
        </label>
        <Input id={`judul-${id}`} value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <Button type="submit" variant="outline" disabled={pending || value.trim() === title}>
        Simpan
      </Button>
    </form>
  );
}
