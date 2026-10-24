import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Daftar" };

// Sementara sampai Tahap 2 (E.1.1, E.2).
export default function DaftarPage() {
  return (
    <ComingSoon
      title="Pendaftaran akun sedang disiapkan"
      description="Formulir pendaftaran dibuka bersama sistem autentikasi. Sementara itu, katalog program bisa dilihat tanpa akun."
      whatsComing={[
        "Daftar dengan nama, email, nomor WhatsApp, jenjang, dan target ujian",
        "Bab 1 dan 2 setiap kelas terbuka gratis setelah mendaftar",
        "Verifikasi email dan lengkapi profil",
      ]}
    />
  );
}
