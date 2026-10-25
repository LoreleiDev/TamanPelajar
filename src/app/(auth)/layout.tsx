import { Logo } from "@/components/layout/logo";
import { BackButton } from "@/components/shared/back-button";
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
        <Logo tone="inverse" size="lg" className="relative self-start" />
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
        {/* Logo bukan tautan; tombol kembali menggantikan fungsi "ke beranda". */}
        <BackButton />
        <Logo className="mt-4 lg:hidden" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
