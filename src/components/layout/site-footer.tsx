import { Globe, Mail } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import type { ReactNode } from "react";

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

/**
 * Footer (D.1.9): kolom di atas, wordmark selebar halaman di bawah. Baris kontak
 * mengikuti logo: ikon kecil lalu nama akun.
 */
export async function SiteFooter() {
  const year = await copyrightYear();
  const socials = [
    { ...contact.facebook, icon: FacebookIcon, label: "Facebook" },
    { ...contact.instagram, icon: InstagramIcon, label: "Instagram" },
    { ...contact.website, icon: Globe, label: "Situs web" },
  ];

  return (
    <footer className="mt-auto bg-primary text-white">
      {/* pb-24 di mobile agar baris terakhir tidak tertutup bottom nav (B.3.2) */}
      <div className="page-container flex flex-col gap-14 pt-14 pb-24 md:pt-20 md:pb-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <Column title="Tentang Taman Pelajar">
            <p className="max-w-sm text-white/85">
              Bimbel online untuk UTBK/SNBT, SKD CPNS, sekolah kedinasan, dan tes potensi akademik: kelas
              berurutan, video per topik, dan tryout CBT dengan pembahasan.
            </p>
            <CheckList
              tone="inverse"
              className="text-sm font-semibold"
              items={["Pelatihan berkualitas", "Penilaian cermat", "Sertifikat akurat"]}
            />
          </Column>
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
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white/85 hover:text-white"
                  >
                    <Icon className="size-4" />
                    <span className="sr-only">{label}: </span>
                    {handle}
                  </a>
                </li>
              ))}
            </ul>
            <LinkList links={footerNav.tentang} />
          </Column>
        </div>

        <div className="flex flex-col gap-4">
          <svg viewBox="0 0 1000 112" role="img" aria-label="Taman Pelajar" className="w-full text-white">
            <text
              x="0"
              y="96"
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              fill="currentColor"
              className="font-sans"
              style={{ fontSize: 124, fontWeight: 800, letterSpacing: "-0.03em" }}
            >
              TAMAN PELAJAR
            </text>
          </svg>
          <p className="text-sm text-white/75">
            © {year} Taman Pelajar. Seluruh materi, soal, dan ilustrasi dibuat oleh tim Taman Pelajar.
          </p>
        </div>
      </div>
    </footer>
  );
}
