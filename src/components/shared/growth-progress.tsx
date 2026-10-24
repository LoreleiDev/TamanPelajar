import { cn } from "@/lib/utils";

/**
 * Progres yang "tumbuh": batang berwarna daun dengan tunas kecil di ujungnya.
 * Dipakai untuk progres kelas dan kepenuhan kuota; nilai tetap ditulis sebagai teks.
 */
export function GrowthProgress({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative h-2.5 rounded-full bg-secondary"
      >
        <div className="h-full rounded-full bg-leaf transition-[width] duration-200" style={{ width: `${pct}%` }} />
        {pct > 0 && (
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="absolute -top-3 size-4 -translate-x-1/2"
            style={{ left: `min(${pct}%, calc(100% - 0.5rem))` }}
          >
            <path d="M8 16V9" stroke="var(--brand-bark)" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M7.6 9.6C4 10 1.4 7.6 1 3.6c4-.2 6.6 2 6.6 6Z" fill="var(--brand-primary)" />
            <path d="M8.4 8.4C8.8 4.4 11.4 1.6 15 1.6c0 4.2-2.8 6.8-6.6 6.8Z" fill="var(--brand-olive)" />
          </svg>
        )}
      </div>
    </div>
  );
}
