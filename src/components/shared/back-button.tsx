"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/**
 * Tombol kembali ke halaman sebelumnya. Bila halaman dibuka langsung (tanpa riwayat dari
 * situs ini), kembali ke `fallback`.
 */
export function BackButton({ fallback = "/", label = "Kembali" }: { fallback?: string; label?: string }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-3 self-start text-muted-foreground hover:text-foreground"
      onClick={() => {
        const sameOrigin = document.referrer.startsWith(window.location.origin);
        if (sameOrigin && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      <ArrowLeft aria-hidden="true" data-icon="inline-start" />
      {label}
    </Button>
  );
}
