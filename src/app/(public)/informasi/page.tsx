import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Informasi" };

// Sementara sampai butir D.4 dibangun.
export default function Page() {
  return (
    <ComingSoon
      title="Artikel dan pengumuman sedang disiapkan"
      description="Halaman ini akan berisi jadwal ujian, pengumuman, tips belajar, dan informasi pendaftaran."
      whatsComing={[
        "Jadwal UTBK, SKD, dan seleksi kedinasan",
        "Tips belajar dari tim Taman Pelajar",
        "Pengumuman program dan tryout",
      ]}
    />
  );
}
