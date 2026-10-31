import { Globe, Mail } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { contact, footerNav } from "@/components/layout/nav-items";
import { FacebookIcon, InstagramIcon } from "@/components/layout/social-icons";
import { CheckList } from "@/components/shared/check-list";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {children}
    </div>
  );
}

function LinkList({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="text-white/85 underline-offset-4 hover:text-white hover:underline">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Tahun dibaca dari cache harian agar halaman tetap bisa di-prerender (cacheComponents).
async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** Garis tunas samar di pojok footer; dekoratif, mengikuti motif logo. */
function FooterSprout() {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute -right-20 -bottom-28 hidden w-84 text-white opacity-[0.09] lg:block"
    >
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <circle cx="200" cy="200" r="172" />
        <circle cx="200" cy="200" r="132" />
        <path d="M200 340C201 290 198 250 200 204" />
        <path d="M198 238C148 242 98 212 82 150c58-10 110 22 116 88Z" />
        <path d="M202 202c4-68 50-118 122-122 0 74-50 120-122 122Z" />
        <path d="M188 226c-28-16-58-38-84-66M214 190c26-26 56-58 90-88" />
      </g>
    </svg>
  );
}

/**
 * Footer (D.1.9): tepi atas melengkung dari halaman putih, kolom brand dan tautan, lalu strip
 * bawah berisi hak cipta dan tautan legal. Baris kontak mengikuti logo: ikon kecil lalu nama akun.
 */
export async function SiteFooter() {
  const year = await copyrightYear();
  const socials = [
    { ...contact.facebook, icon: FacebookIcon, label: "Facebook" },
    { ...contact.instagram, icon: InstagramIcon, label: "Instagram" },
    { ...contact.website, icon: Globe, label: "Situs web" },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden bg-primary text-white">
      <svg aria-hidden="true" viewBox="0 0 1440 48" preserveAspectRatio="none" className="absolute inset-x-0 -top-px h-6 w-full text-background md:h-10">
        <path d="M0 0h1440v16c-240 28-480 30-720 14S240 2 0 24Z" fill="currentColor" />
      </svg>
      <FooterSprout />

      <div className="page-container relative grid gap-10 pt-16 pb-12 sm:grid-cols-2 md:pt-24 md:pb-14 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-12">
        <div className="flex flex-col gap-5">
          <Logo tone="inverse" />
          <p className="max-w-sm text-white/85">
            Bimbel online untuk UTBK/SNBT, SKD CPNS, sekolah kedinasan, dan tes potensi akademik: kelas berurutan, video per topik,
            dan tryout CBT dengan pembahasan.
          </p>
          <CheckList tone="inverse" className="text-sm font-semibold" items={["Pelatihan berkualitas", "Penilaian cermat", "Sertifikat akurat"]} />
        </div>
        <Column title="Produk">
          <LinkList links={footerNav.produk} />
        </Column>
        <Column title="Bantuan">
          <LinkList links={footerNav.bantuan} />
        </Column>
        <Column title="Kontak">
          <ul className="flex flex-col gap-2.5">
            <li>
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 text-white/85 hover:text-white">
                <Mail aria-hidden="true" className="size-4" />
                {contact.email}
              </a>
            </li>
            {socials.map(({ href, handle, icon: Icon, label }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/85 hover:text-white">
                  <Icon className="size-4" />
                  <span className="sr-only">{label}: </span>
                  {handle}
                </a>
              </li>
            ))}
          </ul>
        </Column>
      </div>

      {/* pb-24 di mobile agar baris terakhir tidak tertutup bottom nav (B.3.2) */}
      <div className="relative bg-primary-hover">
        <div className="page-container flex flex-col gap-3 pt-5 pb-24 text-sm md:flex-row md:items-center md:justify-between md:pb-5">
          <p className="text-white/90">© {year} Taman Pelajar. Seluruh materi, soal, dan ilustrasi dibuat oleh tim Taman Pelajar.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/90 underline-offset-4 hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
