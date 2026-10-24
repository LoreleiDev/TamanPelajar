import Image from "next/image";

import { cn } from "@/lib/utils";

// Tanda tunas dari brand/logo.jpeg + tulisan kapital tebal hijau tua seperti brand/reference.jpeg.
// Tulisan sengaja berupa teks HTML agar memakai Plus Jakarta Sans dan tetap tajam.
// TODO: bila tersedia logo lengkap (tunas + tulisan), ganti seluruh komponen dengan file itu.

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
