"use client";

import { PlayCircle } from "lucide-react";

import { useRequireLogin } from "@/components/shared/require-login";
import { Button } from "@/components/ui/button";

/** Pengganti pemutar untuk tamu (C.5.2–C.5.3). */
export function LoginToWatch({ title }: { title: string }) {
  const { requireLogin } = useRequireLogin();
  return (
    <div className="grid aspect-video place-items-center rounded-xl bg-secondary p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <PlayCircle className="size-12 text-primary" aria-hidden="true" />
        <p className="max-w-sm">Masuk untuk menonton video ini dan menyimpan posisi terakhirmu.</p>
        <Button size="lg" onClick={() => requireLogin(`Untuk menonton “${title}”, masuk ke akunmu.`)}>
          Masuk untuk menonton
        </Button>
      </div>
    </div>
  );
}
