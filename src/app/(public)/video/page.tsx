import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Video belajar" };

// Sementara sampai butir H.1 dibangun.
export default function Page() {
  return (
    <ComingSoon
      title="Pustaka video sedang disiapkan"
      description="Video per topik dibuka bersama sistem kelas. Sementara itu, jumlah video setiap paket bisa dilihat di katalog."
      whatsComing={[
        "Filter mata pelajaran, durasi, dan tingkat kesulitan",
        "Posisi terakhir video tersimpan otomatis",
        "Catatan dan tombol simpan di setiap video",
      ]}
    />
  );
}
