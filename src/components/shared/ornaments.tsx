import { cn } from "@/lib/utils";

// Motif dari logo (CLAUDE.md "Desain anti-generik"): tunas, lengkung hijau di satu sudut
// dan gelombang abu di sudut seberang, pola titik. Semua dekoratif (aria-hidden).

export function SproutMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={cn("shrink-0", className)}>
      <path d="M24 46V27" stroke="var(--brand-bark)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M23 28C13 29 5 22 3 10c12-1 20 6 20 18Z" fill="var(--brand-primary)" />
      <path d="M25 24C26 12 34 4 46 4c0 13-9 21-21 20Z" fill="var(--brand-olive)" />
      <path
        d="M21 26C15 22 10 17 7 13M28 21c4-5 9-10 14-13"
        stroke="var(--brand-leaf)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Pembatas section: garis tanah dengan satu tunas. */
export function SproutDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex items-end gap-3", className)}>
      <SproutMark className="size-7" />
      <span className="mb-[3px] h-[3px] flex-1 rounded-full bg-muted" />
    </div>
  );
}

/**
 * Sepasang ornamen sudut: lengkung organik hijau tua di kanan atas dan gelombang
 * abu-abu muda di kiri bawah. Cukup satu pasang per layar (hero, CTA, halaman masuk).
 * Induknya wajib `relative overflow-hidden`.
 */
export function OrganicCorners({
  tone = "on-light",
  className,
}: {
  tone?: "on-light" | "on-green";
  className?: string;
}) {
  const leaf = tone === "on-green" ? "rgb(255 255 255 / 0.10)" : "var(--brand-primary)";
  const wave = tone === "on-green" ? "rgb(255 255 255 / 0.07)" : "var(--brand-mist)";
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      <svg viewBox="0 0 200 200" className="absolute -top-px -right-px w-[min(38vw,320px)]">
        <path d="M200 0H40c10 60 60 112 160 128Z" fill={leaf} />
        <path d="M200 0h-70c8 34 34 58 70 66Z" fill={leaf} opacity="0.6" />
      </svg>
      <svg viewBox="0 0 240 120" className="absolute -bottom-px -left-px w-[min(44vw,380px)]">
        <path d="M0 120V40c40-18 70 26 120 22s72-44 120-30v88Z" fill={wave} />
      </svg>
    </div>
  );
}

/** Pola titik kecil hijau sebagai aksen sesekali. */
export function DotPattern({ className, rows = 4, cols = 6 }: { className?: string; rows?: number; cols?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${cols * 14} ${rows * 14}`}
      className={cn("pointer-events-none", className)}
      width={cols * 14}
      height={rows * 14}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <circle key={i} cx={(i % cols) * 14 + 4} cy={Math.floor(i / cols) * 14 + 4} r="2.2" fill="currentColor" />
      ))}
    </svg>
  );
}
