import Link from "next/link";

import { BuyButton } from "@/components/shared/buy-button";
import { PriceTag } from "@/components/shared/price-tag";
import { ProductCover } from "@/components/shared/product-cover";
import { Rating } from "@/components/shared/rating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { programTypeLabels } from "@/features/catalog/labels";
import type { ProductSummary } from "@/features/catalog/types";
import { cn } from "@/lib/utils";

/** Angka isi paket; yang bernilai nol tidak ditampilkan agar kartu tidak berisi "0 video". */
function contents(p: ProductSummary) {
  return [
    p.videoCount > 0 && { label: "video", value: p.videoCount },
    p.materialCount > 0 && { label: "kelas", value: p.materialCount },
    p.tryoutCount > 0 && { label: "tryout", value: p.tryoutCount },
    { label: "hari aktif", value: p.activeDays },
  ].filter((x): x is { label: string; value: number } => Boolean(x));
}

/** Kartu paket (D.1.4, D.2.4). Border tipis tanpa shadow; satu-satunya varian kartu paket. */
export function ProductCard({
  product,
  headingLevel = "h3",
  className,
}: {
  product: ProductSummary;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  const href = `/paket/${product.slug}`;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-150 hover:border-primary/40",
        className,
      )}
    >
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <ProductCover product={product} />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">{product.category.name}</span>
          <span aria-hidden="true">, </span>
          {programTypeLabels[product.programType].toLowerCase()}
        </p>
        <Heading className="text-lg leading-snug font-bold text-foreground">
          <Link href={href} className="hover:text-primary focus-visible:text-primary">
            {product.name}
          </Link>
        </Heading>
        <p className="text-sm text-muted-foreground">{product.summary}</p>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
          {contents(product).map((c) => (
            <div key={c.label} className="flex gap-1">
              <dt className="sr-only">{c.label}</dt>
              <dd>
                <span className="font-semibold text-foreground">{c.value}</span>{" "}
                <span className="text-muted-foreground">{c.label}</span>
              </dd>
            </div>
          ))}
        </dl>
        <Rating value={product.ratingAvg} count={product.ratingCount} />
        <div className="mt-auto flex flex-col gap-3 pt-2">
          <PriceTag price={product.price} promoPrice={product.promoPrice} />
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <Link href={href}>
                Lihat detail<span className="sr-only"> {product.name}</span>
              </Link>
            </Button>
            <BuyButton productName={product.name} />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Skeleton dengan bentuk yang sama dengan ProductCard (P.2.4). */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border" aria-hidden="true">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-3 h-6 w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    </div>
  );
}
