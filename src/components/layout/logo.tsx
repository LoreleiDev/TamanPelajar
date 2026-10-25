import Image from "next/image";

import { cn } from "@/lib/utils";

// Tanda tunas dari brand/logo.jpeg + wordmark satu baris. "TAMAN" tebal dan "PELAJAR" lebih
// ringan memberi kontras bobot dalam satu warna hijau tua; baris kecil di bawahnya menjelaskan
// jenis layanan. Tulisan berupa teks HTML agar memakai Plus Jakarta Sans dan tetap tajam.
// TODO: bila tersedia logo lengkap (tunas + tulisan), ganti seluruh komponen dengan file itu.

const sizes = {
  md: { mark: 38, word: "text-[1.0625rem]", sub: "text-[0.625rem]" },
  lg: { mark: 56, word: "text-2xl", sub: "text-xs" },
};

export function Logo({
  size = "md",
  tone = "default",
  className,
}: {
  size?: keyof typeof sizes;
  /** "inverse" untuk latar hijau (panel halaman masuk). */
  tone?: "default" | "inverse";
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo-taman-pelajar.jpeg"
        alt="Taman Pelajar"
        width={s.mark}
        height={s.mark}
        className={cn("shrink-0 rounded-full", tone === "inverse" && "ring-2 ring-white/80")}
        priority
      />
      <span aria-hidden="true" className="flex flex-col gap-1 leading-none">
        <span
          className={cn(
            "tracking-[0.04em] whitespace-nowrap uppercase",
            s.word,
            tone === "inverse" ? "text-white" : "text-primary",
          )}
        >
          <span className="font-extrabold">Taman</span> <span className="font-medium">Pelajar</span>
        </span>
        <span
          className={cn(
            "font-semibold tracking-[0.2em] whitespace-nowrap uppercase",
            s.sub,
            tone === "inverse" ? "text-white/80" : "text-muted-foreground",
          )}
        >
          Bimbingan belajar
        </span>
      </span>
    </span>
  );
}
