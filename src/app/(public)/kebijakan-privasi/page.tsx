import type { Metadata } from "next";

import { contact } from "@/components/layout/nav-items";
import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Kebijakan privasi",
  description: "Data apa yang dikumpulkan Taman Pelajar, untuk apa, dan bagaimana Anda mengendalikannya.",
};

export default function KebijakanPrivasiPage() {
  return (
    <InfoPage
      title="Kebijakan privasi"
      intro="Kebijakan ini menjelaskan data pribadi yang kami kumpulkan saat Anda memakai Taman Pelajar, tujuan pemakaiannya, dan hak Anda atas data tersebut."
      updatedAt="24 Oktober 2026"
      sections={[
        {
          id: "data",
          title: "Data yang kami kumpulkan",
          body: (
            <ul>
              <li>Data akun: nama, email, nomor WhatsApp, jenjang pendidikan, dan target ujian.</li>
              <li>Data belajar: progres kelas, posisi video, catatan pribadi, jawaban dan nilai tryout.</li>
              <li>
                Data transaksi: paket yang dibeli, metode dan status pembayaran. Data kartu atau rekening diproses
                oleh penyedia pembayaran, bukan disimpan oleh kami.
              </li>
              <li>Data teknis: alamat IP dan aktivitas selama tryout (misalnya pindah tab) untuk menjaga keadilan ujian.</li>
            </ul>
          ),
        },
        {
          id: "tujuan",
          title: "Untuk apa data dipakai",
          body: (
            <ul>
              <li>Menjalankan akun, membuka akses paket, dan menyimpan progres belajar.</li>
              <li>Menghitung nilai, peringkat, dan rekomendasi materi.</li>
              <li>Mengirim pemberitahuan penting seperti status pembayaran dan jadwal tryout.</li>
              <li>Mencegah penyalahgunaan, misalnya percobaan masuk berulang.</li>
            </ul>
          ),
        },
        {
          id: "berbagi",
          title: "Berbagi data dengan pihak lain",
          body: (
            <p>
              Kami tidak menjual data pribadi. Data hanya dibagikan kepada penyedia layanan yang membantu kami
              menjalankan aplikasi, yaitu penyedia pembayaran, penyimpanan file, dan hosting, sebatas yang
              diperlukan untuk layanan itu. Peringkat tryout hanya menampilkan nama depan dan inisial.
            </p>
          ),
        },
        {
          id: "keamanan",
          title: "Keamanan",
          body: (
            <p>
              Password disimpan dalam bentuk hash, sesi memakai cookie yang hanya bisa dibaca server, dan file
              materi berbayar dikirim lewat tautan bertanda tangan yang kedaluwarsa.
            </p>
          ),
        },
        {
          id: "hak",
          title: "Hak Anda",
          body: (
            <p>
              Anda dapat melihat dan mengubah data profil dari dashboard, serta meminta salinan atau penghapusan
              akun dengan mengirim email ke{" "}
              <a href={`mailto:${contact.email}`} className="font-semibold text-primary underline underline-offset-4">
                {contact.email}
              </a>
              . Riwayat transaksi tetap kami simpan sesuai kewajiban pencatatan keuangan.
            </p>
          ),
        },
      ]}
    />
  );
}
