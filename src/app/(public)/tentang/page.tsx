import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Tentang",
  description: "Taman Pelajar adalah bimbel online untuk persiapan UTBK/SNBT, SKD CPNS, sekolah kedinasan, dan tes potensi akademik.",
};

export default function TentangPage() {
  return (
    <InfoPage
      title="Tentang Taman Pelajar"
      intro="Taman Pelajar adalah bimbingan belajar online untuk persiapan ujian masuk perguruan tinggi, seleksi CPNS, sekolah kedinasan, dan tes potensi akademik."
      sections={[
        {
          id: "nama",
          title: "Mengapa taman",
          body: (
            <p>
              Belajar untuk ujian seleksi mirip merawat tanaman: hasilnya datang dari kebiasaan kecil yang
              dilakukan setiap hari, bukan dari belajar semalam suntuk. Karena itu materi kami dipecah per
              bab dan per topik, dan setiap tryout menunjukkan bagian mana yang sudah tumbuh dan mana yang
              masih perlu dirawat.
            </p>
          ),
        },
        {
          id: "cara-belajar",
          title: "Cara belajar di Taman Pelajar",
          body: (
            <ul>
              <li>Kelas online berurutan per bab, berisi video, PDF ringkasan, dan kuis.</li>
              <li>Video belajar per topik yang bisa ditonton lepas dari kelas.</li>
              <li>Tryout berbasis komputer dengan timer, penilaian otomatis, peringkat, dan pembahasan.</li>
              <li>Analisis nilai per topik untuk menentukan materi yang perlu diulang.</li>
            </ul>
          ),
        },
        {
          id: "soal",
          title: "Tentang soal dan materi",
          body: (
            <p>
              Seluruh soal, pembahasan, dan materi disusun oleh tim Taman Pelajar mengikuti kisi-kisi resmi
              yang diumumkan penyelenggara ujian. Kami tidak menyalin soal dari lembaga lain.
            </p>
          ),
        },
        {
          id: "mulai",
          title: "Mulai dari mana",
          body: (
            <p>
              Buka <Link href="/program" className="font-semibold text-primary underline underline-offset-4">katalog program</Link>{" "}
              dan pilih sesuai target ujian. Bab 1 dan 2 setiap kelas bisa dicoba gratis setelah membuat akun.
            </p>
          ),
        },
      ]}
    />
  );
}
