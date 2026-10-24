"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Cetak atau simpan sebagai PDF lewat dialog cetak peramban. */
export function PrintButton({ label = "Cetak atau simpan PDF" }: { label?: string }) {
  return (
    <Button size="lg" onClick={() => window.print()} className="print:hidden">
      <Printer data-icon="inline-start" />
      {label}
    </Button>
  );
}
