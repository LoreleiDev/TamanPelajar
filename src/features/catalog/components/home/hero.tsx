import Link from "next/link";

import { OrganicCorners } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";
import type { PlatformStats } from "@/features/catalog/types";

import { HeroIllustration } from "./hero-illustration";

const number = new Intl.NumberFormat("id-ID");

/**
 * Hero (D.1.1): gradient hijau tua ke zaitun, judul kapital tebal, dua aksi, angka
 * platform dari data, dan ilustrasi tunas di kanan (sementara, sampai ada ilustrasi pelajar).
 */
export function Hero({ stats }: { stats: PlatformStats }) {
  const figures = [
    { value: stats.students, label: "siswa terdaftar" },
    { value: stats.courses, label: "kelas" },
    { value: stats.questions, label: "soal latihan" },
  ];

  return (
    <section
      aria-labelledby="hero-judul"
      className="relative overflow-hidden bg-linear-to-br from-primary to-olive text-white" // taste-skill-ignore: gradient hero wajib (D.1.1)
    >
      <OrganicCorners tone="on-green" />
      <div className="page-container relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
        <div className="flex flex-col gap-6">
          <h1 id="hero-judul" className="text-title max-w-[20ch] uppercase lg:text-[clamp(2.5rem,1rem+2.9vw,3.75rem)]">
            Mulai langkah pertamumu menuju masa depan impian
          </h1>
          <p className="text-lead max-w-[46ch] text-white/90">
            Kelas online, video per topik, latihan soal, dan tryout CBT dengan pembahasan untuk UTBK/SNBT, SKD CPNS,
            sekolah kedinasan, dan tes potensi akademik.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="inverse">
              <Link href="/program">Mulai belajar</Link>
            </Button>
            <Button asChild size="lg" variant="inverse-outline">
              <Link href="/tryout">Lihat tryout</Link>
            </Button>
          </div>
          <dl className="flex flex-wrap gap-2 pt-2">
            {figures.map((f) => (
              <div key={f.label} className="flex items-baseline gap-1.5 rounded-full bg-white/12 px-3.5 py-1.5 text-sm">
                <dt className="sr-only">{f.label}</dt>
                <dd className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold tabular-nums">{number.format(f.value)}</span>
                  <span className="text-white/85">{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="hidden justify-end lg:flex">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
