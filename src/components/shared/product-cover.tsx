import Image from "next/image";

import type { ProductSummary, ProgramType } from "@/features/catalog/types";
import { cn } from "@/lib/utils";

const fields: Record<ProgramType, string> = {
  BUNDEL: "bg-primary",
  KELAS: "bg-olive",
  TRYOUT: "bg-foreground",
};

/**
 * Sampul paket. Selama belum ada thumbnail Cloudinary, sampul berupa bidang warna per
 * jenis program dengan singkatan program yang besar (TODO: ilustrasi per program).
 */
export function ProductCover({
  product,
  className,
  sizes = "(min-width: 1024px) 33vw, 100vw",
}: {
  product: Pick<ProductSummary, "name" | "thumbnailUrl" | "programType" | "category">;
  className?: string;
  sizes?: string;
}) {
  if (product.thumbnailUrl) {
    return (
      <div className={cn("relative aspect-[16/9] overflow-hidden", className)}>
        <Image src={product.thumbnailUrl} alt={product.name} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex aspect-[16/9] items-end overflow-hidden p-4 text-white",
        fields[product.programType],
        className,
      )}
    >
      <svg viewBox="0 0 120 120" className="absolute -top-6 -right-6 w-2/5 opacity-15">
        <path d="M58 72C33 74 13 56 8 26c30-3 50 15 50 46Z" fill="currentColor" />
        <path d="M62 62C65 32 85 12 114 12c0 32-22 52-52 50Z" fill="currentColor" />
        <path d="M60 120V70" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      </svg>
      <span className="text-[clamp(2rem,5vw,3rem)] leading-none font-extrabold tracking-tight">
        {product.category.shortName}
      </span>
    </div>
  );
}
