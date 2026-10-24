import { CircleCheck } from "lucide-react";

import { Logo } from "@/components/layout/logo";

// Halaman sementara Tahap 0. Beranda lengkap (D.1) dibangun di Tahap 1.
const tagline = ["Pelatihan berkualitas", "Penilaian cermat", "Sertifikat akurat"];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-16 sm:px-8">
      <Logo size="lg" />
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary uppercase sm:text-4xl">
          Taman Pelajar sedang disiapkan
        </h1>
        <p className="max-w-prose text-base text-muted-foreground">
          Kelas online, video pembelajaran, dan tryout CBT dengan pembahasan untuk
          UTBK/SNBT, SKD CPNS, sekolah kedinasan, dan tes potensi akademik.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {tagline.map((item) => (
          <li key={item} className="flex items-center gap-2 font-semibold text-foreground">
            <CircleCheck className="size-5 text-primary" strokeWidth={2} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </main>
  );
}
