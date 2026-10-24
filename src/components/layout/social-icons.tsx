import type { SVGProps } from "react";

// Lucide v1 tidak lagi memuat ikon merek; dua ikon ini digambar dengan gaya garis yang sama
// (viewBox 24, stroke 2, ujung bulat) agar konsisten dengan ikon Lucide lain di footer.

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 8h-1.5A2.5 2.5 0 0 0 11 10.5V21M8.5 13.5H15" />
    </svg>
  );
}
