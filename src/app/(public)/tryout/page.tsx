import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Tryout" };

// Sementara sampai butir I.1 dibangun.
export default function Page() {
  return (
    <ComingSoon
      title="Daftar tryout sedang disiapkan"
      description="Tryout CBT dibuka bersama sistem ujian: timer, simpan otomatis, penilaian, dan pembahasan. Sementara itu, lihat paket yang berisi tryout di katalog."
      whatsComing={[
        "Daftar tryout dengan jadwal, durasi, dan jumlah soal",
        "Petunjuk dan aturan sebelum mulai",
        "Hasil, peringkat, dan pembahasan setelah selesai",
      ]}
    />
  );
}
