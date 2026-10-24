// Menu utama (B.2.2) dan bottom navigation mobile (B.3.2), satu sumber untuk navbar,
// menu hamburger, bottom nav, dan footer.

export const mainNav = [
  { href: "/", label: "Beranda" },
  { href: "/program", label: "Mulai Belajar" },
  { href: "/tryout", label: "Tryout" },
  { href: "/video", label: "Video" },
  { href: "/kelas", label: "Kelas Online" },
  { href: "/informasi", label: "Informasi" },
] as const;

/** Aktif bila path sama, atau berada di bawahnya (kecuali beranda). */
export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const footerNav = {
  produk: [
    { href: "/program", label: "Katalog program" },
    { href: "/tryout", label: "Tryout CBT" },
    { href: "/kelas", label: "Kelas online" },
    { href: "/video", label: "Video belajar" },
  ],
  bantuan: [
    { href: "/bantuan", label: "Pusat bantuan" },
    { href: "/kontak", label: "Hubungi kami" },
    { href: "/kebijakan-privasi", label: "Kebijakan privasi" },
    { href: "/syarat-ketentuan", label: "Syarat dan ketentuan" },
  ],
  tentang: [
    { href: "/tentang", label: "Tentang Taman Pelajar" },
    { href: "/informasi", label: "Informasi dan artikel" },
  ],
};

// Akun dari baris kontak di brand/reference.jpeg.
export const contact = {
  email: "halo@tamanpelajar.com",
  instagram: { handle: "@taman.pelajar", href: "https://www.instagram.com/taman.pelajar" },
  facebook: { handle: "Taman Pelajar", href: "https://www.facebook.com/tamanpelajar" },
  website: { handle: "www.tamanpelajar.com", href: "https://www.tamanpelajar.com" },
};
