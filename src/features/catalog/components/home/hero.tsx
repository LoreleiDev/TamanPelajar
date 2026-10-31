import Link from "next/link";

import { OrganicCorners } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";
import type { PlatformStats } from "@/features/catalog/types";

import { HeroIllustration } from "./hero-illustration";

const number = new Intl.NumberFormat("id-ID");

/**
 * Hero (D.1.1, revisi RMED): latar putih dengan teks hijau tua, judul kapital tebal seperti
 * logo, dua aksi, angka platform dari data, dan ilustrasi tunas di kanan (sementara, sampai
 * ada ilustrasi pelajar). Lengkung hijau di sudut mengikuti poster logo; gelombang abu-abunya
 * ditiadakan karena sudut bawah dipakai angka platform.
 */
export function Hero({ stats }: { stats: PlatformStats }) {
  const figures = [
    { value: stats.students, label: "siswa terdaftar" },
    { value: stats.courses, label: "kelas" },
    { value: stats.questions, label: "soal latihan" },
  ];

  return (
    <section aria-labelledby="hero-judul" className="relative overflow-hidden bg-background text-primary">
      <OrganicCorners wave={false} />
      <div className="page-container relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
        <div className="flex flex-col gap-6">
          <h1 id="hero-judul" className="text-title max-w-[20ch] uppercase lg:text-[clamp(2.5rem,1rem+2.9vw,3.75rem)]">
            Mulai langkah pertamumu menuju masa depan impian
          </h1>
          <p className="text-lead max-w-[46ch] text-primary">
            Kelas online, video per topik, latihan soal, dan tryout CBT dengan pembahasan untuk UTBK/SNBT, SKD CPNS,
            sekolah kedinasan, dan tes potensi akademik.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/program">Mulai belajar</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary bg-background text-primary hover:bg-accent hover:text-primary">
              <Link href="/tryout">Lihat tryout</Link>
            </Button>
          </div>
          <dl className="flex flex-wrap gap-2 pt-2">
            {figures.map((f) => (
              <div key={f.label} className="flex items-baseline gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm">
                <dt className="sr-only">{f.label}</dt>
                <dd className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold tabular-nums">{number.format(f.value)}</span>
                  <span>{f.label}</span>
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
