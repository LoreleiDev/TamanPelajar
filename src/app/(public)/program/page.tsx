import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Katalog program" };

// Diganti katalog lengkap (D.2) di branch berikutnya.
export default function Page() {
  return (
    <ComingSoon
      title="Katalog program sedang disiapkan"
      description="Daftar paket UTBK/SNBT, SKD CPNS, sekolah kedinasan, dan tes potensi akademik."
      whatsComing={["Pencarian dan filter", "Urutan harga dan popularitas"]}
    />
  );
}
