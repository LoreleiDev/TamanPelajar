import Image from "next/image";
import type { ReactNode } from "react";

import type { ProductSummary, ProgramType } from "@/features/catalog/types";
import { cn } from "@/lib/utils";

const fields: Record<ProgramType, string> = {
  BUNDEL: "bg-primary",
  KELAS: "bg-olive",
  TRYOUT: "bg-foreground",
};

/** Tunas samar di sudut kanan atas, sama untuk sampul paket dan video. */
function CoverSprout() {
  return (
    <svg viewBox="0 0 120 120" className="absolute -top-6 -right-6 w-2/5 opacity-15">
      <path d="M58 72C33 74 13 56 8 26c30-3 50 15 50 46Z" fill="currentColor" />
      <path d="M62 62C65 32 85 12 114 12c0 32-22 52-52 50Z" fill="currentColor" />
      <path d="M60 120V70" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

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
      <CoverSprout />
      <span className="text-[clamp(2rem,5vw,3rem)] leading-none font-extrabold tracking-tight">
        {product.category.shortName}
      </span>
    </div>
  );
}

const topicFields = ["bg-primary", "bg-olive", "bg-foreground"] as const;

/** Singkatan mata pelajaran: "Penalaran Umum" -> "PU", "Tes Wawasan Kebangsaan" -> "TWK". */
export function subjectInitials(subject: string) {
  return subject
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 4);
}

/**
 * Sampul video/topik dengan bahasa visual yang sama dengan sampul paket: bidang warna
 * brand per mata pelajaran (warna tetap per mapel), singkatan besar, dan tunas samar.
 */
export function TopicCover({ subject, className, children }: { subject: string; className?: string; children?: ReactNode }) {
  let h = 0;
  for (const c of subject) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <div className={cn("relative flex aspect-video items-end overflow-hidden p-4 text-white", topicFields[h % topicFields.length], className)}>
      <CoverSprout />
      <span aria-hidden="true" className="text-[clamp(1.75rem,4vw,2.5rem)] leading-none font-extrabold tracking-tight">
        {subjectInitials(subject)}
      </span>
      {children}
    </div>
  );
}
