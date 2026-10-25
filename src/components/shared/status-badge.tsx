import { CircleCheck, CircleX, Clock, MinusCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Label status tunggal (CLAUDE.md "warna disertai ikon atau teks"). Nada:
// berhasil (hijau status, bukan hijau brand), gagal, menunggu, netral.
export type StatusTone = "berhasil" | "gagal" | "menunggu" | "netral";

const tones: Record<StatusTone, { icon: LucideIcon; text: string; box: string }> = {
  berhasil: { icon: CircleCheck, text: "text-success", box: "border-success bg-success/10" },
  gagal: { icon: CircleX, text: "text-destructive", box: "border-destructive bg-destructive/8" },
  menunggu: { icon: Clock, text: "text-warning", box: "border-warning bg-warning/10" },
  netral: { icon: MinusCircle, text: "text-muted-foreground", box: "border-border bg-background" },
};

/**
 * `inline`: ikon + teks berwarna, untuk tabel dan baris padat.
 * `box`: kotak berbingkai, untuk status utama halaman.
 */
export function StatusBadge({
  tone,
  children,
  variant = "inline",
  icon,
  className,
  role,
}: {
  tone: StatusTone;
  children: ReactNode;
  variant?: "inline" | "box";
  icon?: LucideIcon;
  className?: string;
  role?: "status";
}) {
  const t = tones[tone];
  const Icon = icon ?? t.icon;
  return (
    <span
      role={role}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold",
        t.text,
        variant === "box" && cn("self-start rounded-lg border-2 px-3 py-1.5 font-bold", t.box),
        className,
      )}
    >
      <Icon aria-hidden="true" className={variant === "box" ? "size-5" : "size-[1.05em]"} />
      {children}
    </span>
  );
}


/** Status lulus terhadap ambang batas (I.6.6); null = tanpa ambang batas. */
export function PassStatus({ passed, className }: { passed: boolean | null; className?: string }) {
  if (passed === null) return <span className={cn("text-muted-foreground", className)}>Tanpa ambang batas</span>;
  return (
    <StatusBadge tone={passed ? "berhasil" : "gagal"} className={className}>
      {passed ? "Lulus" : "Belum lulus"}
    </StatusBadge>
  );
}
