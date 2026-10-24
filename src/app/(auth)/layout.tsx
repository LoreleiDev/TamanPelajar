import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { CheckList } from "@/components/shared/check-list";
import { OrganicCorners } from "@/components/shared/ornaments";

// Layout halaman autentikasi (E.1): panel brand di kiri (desktop), form di kanan.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside
        className="relative hidden overflow-hidden bg-linear-to-br from-primary to-olive p-12 text-white lg:flex lg:flex-col lg:justify-between" // taste-skill-ignore: gradient brand, satu per layar
      >
        <OrganicCorners tone="on-green" />
        <Link href="/" className="relative self-start rounded-md bg-white px-3 py-2" aria-label="Taman Pelajar, ke beranda">
          <Logo />
        </Link>
        <div className="relative flex flex-col gap-6">
          <p className="text-title max-w-[14ch] uppercase">Belajar runtut, uji seperti aslinya</p>
          <CheckList
            tone="inverse"
            className="text-lg font-semibold"
            items={["Pelatihan berkualitas", "Penilaian cermat", "Sertifikat akurat"]}
          />
        </div>
        <p className="relative max-w-sm text-white/85">
          Bab 1 dan 2 setiap kelas terbuka gratis setelah kamu membuat akun.
        </p>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-8 lg:px-16 lg:py-12">
        <Link href="/" className="self-start rounded-md lg:hidden" aria-label="Taman Pelajar, ke beranda">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-primary">
            Kembali ke beranda
          </Link>
        </p>
      </main>
    </div>
  );
}
