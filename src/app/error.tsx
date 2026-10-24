"use client";

import Link from "next/link";
import { useEffect } from "react";

import { SproutMark } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";

// Halaman error (P.2.8): menjelaskan apa yang terjadi dan cara memperbaikinya.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <main className="page-container flex flex-1 flex-col justify-center gap-6 py-20">
      <SproutMark className="size-12" />
      <h1 className="text-title max-w-2xl text-primary">Halaman gagal dimuat</h1>
      <p className="text-lead max-w-2xl">
        Terjadi kesalahan di server saat menyiapkan halaman ini. Jawaban tryout dan progres belajar Anda tetap
        tersimpan. Coba muat ulang; jika masih gagal, kembali beberapa menit lagi.
      </p>
      {digest && (
        <p className="text-sm text-muted-foreground">
          Kode kesalahan: <span className="tabular-nums">{digest}</span>. Sertakan kode ini jika menghubungi kami.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={() => retry()}>
          Muat ulang halaman
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </main>
  );
}
