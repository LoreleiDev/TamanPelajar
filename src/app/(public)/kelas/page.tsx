import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Kelas online" };

// Sementara sampai butir G dibangun.
export default function Page() {
  return (
    <ComingSoon
      title="Daftar kelas sedang disiapkan"
      description="Kelas berurutan per bab dibuka bersama sistem kelas. Bab 1 dan 2 setiap kelas nantinya gratis setelah masuk."
      whatsComing={[
        "Kurikulum per bab dengan video, PDF, dan kuis",
        "Progres belajar tersimpan otomatis",
        "Sertifikat setelah semua materi selesai",
      ]}
    />
  );
}
