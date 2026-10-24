import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Masuk" };

// Sementara sampai Tahap 2 (E.1.2).
export default function MasukPage() {
  return (
    <ComingSoon
      title="Halaman masuk sedang disiapkan"
      description="Akun Taman Pelajar dibuka bersama sistem autentikasi. Sementara itu, katalog program bisa dilihat tanpa akun."
      whatsComing={[
        "Masuk dengan email dan password",
        "Masuk dengan akun Google",
        "Kembali otomatis ke halaman yang tadi dibuka",
      ]}
    />
  );
}
