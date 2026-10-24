import Image from "next/image";

import { cn } from "@/lib/utils";

// Tanda tunas dari brand/logo.jpeg + tulisan kapital tebal hijau tua seperti brand/reference.jpeg.
// Tulisan sengaja berupa teks HTML agar memakai Plus Jakarta Sans dan tetap tajam.
// TODO: bila tersedia logo lengkap (tunas + tulisan), ganti seluruh komponen dengan file itu.

// Motif tunas sederhana untuk ornamen (pembatas section, empty state), bukan pengganti logo.

export function SproutMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <path
        d="M24 46V27"
        stroke="var(--brand-bark)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
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

const sizes = {
  md: { mark: 36, text: "text-[0.95rem]" },
  lg: { mark: 56, text: "text-2xl" },
};

export function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-primary", className)}>
      <Image
        src="/logo-taman-pelajar.jpeg"
        alt="Taman Pelajar"
        width={sizes[size].mark}
        height={sizes[size].mark}
        className="shrink-0 rounded-full"
        priority
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex flex-col leading-[0.95] font-extrabold tracking-tight uppercase",
          sizes[size].text,
        )}
      >
        <span>Taman</span>
        <span>Pelajar</span>
      </span>
    </span>
  );
}
