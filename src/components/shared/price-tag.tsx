import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { now: "text-lg", was: "text-sm" },
  md: { now: "text-xl", was: "text-sm" },
  lg: { now: "text-3xl", was: "text-base" },
};

/** Harga normal dicoret bila ada harga promo (D.1.4, D.3.3). */
export function PriceTag({
  price,
  promoPrice,
  size = "md",
  className,
}: {
  price: number;
  promoPrice: number | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const hasPromo = promoPrice !== null && promoPrice < price;
  const discount = hasPromo ? Math.round(((price - promoPrice) / price) * 100) : 0;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums", className)}>
      <span className={cn("font-extrabold tracking-tight text-foreground", sizes[size].now)}>
        {formatRupiah(hasPromo ? promoPrice : price)}
      </span>
      {hasPromo && (
        <>
          <s className={cn("text-muted-foreground", sizes[size].was)}>
            <span className="sr-only">Harga normal </span>
            {formatRupiah(price)}
          </s>
          <span className={cn("font-semibold text-bark", sizes[size].was)}>Hemat {discount}%</span>
        </>
      )}
    </div>
  );
}
