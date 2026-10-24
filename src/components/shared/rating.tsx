import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const ratingFormat = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Rating ringkas; paket tanpa ulasan ditulis apa adanya, bukan diberi angka. */
export function Rating({
  value,
  count,
  className,
}: {
  value: number | null;
  count: number;
  className?: string;
}) {
  if (value === null || count === 0) {
    return <span className={cn("text-sm text-muted-foreground", className)}>Belum ada ulasan</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm tabular-nums", className)}>
      <Star className="size-4 fill-bark text-bark" aria-hidden="true" />
      <span className="font-semibold text-foreground">{ratingFormat.format(value)}</span>
      <span className="text-muted-foreground">({count} ulasan)</span>
      <span className="sr-only">Rating {ratingFormat.format(value)} dari 5</span>
    </span>
  );
}

/** Lima bintang untuk satu ulasan. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${value} dari 5 bintang`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn("size-4", i < value ? "fill-bark text-bark" : "text-muted")}
        />
      ))}
    </span>
  );
}
