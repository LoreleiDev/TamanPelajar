import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Syarat dan ketentuan",
  description: "Aturan pemakaian akun, paket belajar, pembayaran, dan tryout di Taman Pelajar.",
};

export default function SyaratKetentuanPage() {
  return (
    <InfoPage
      title="Syarat dan ketentuan"
      intro="Dengan membuat akun atau membeli paket di Taman Pelajar, Anda menyetujui ketentuan berikut."
      updatedAt="24 Oktober 2026"
      sections={[
        {
          id: "akun",
          title: "Akun",
          body: (
            <ul>
              <li>Satu akun untuk satu orang. Akun tidak boleh dipinjamkan atau dipakai bersama.</li>
              <li>Anda bertanggung jawab menjaga kerahasiaan password.</li>
              <li>Kami dapat menonaktifkan akun yang dipakai untuk menyebarkan materi berbayar.</li>
            </ul>
          ),
        },
        {
          id: "paket",
          title: "Paket dan masa aktif",
          body: (
            <ul>
              <li>Masa aktif dihitung sejak pembayaran berhasil dan tertulis di halaman detail paket.</li>
              <li>Setelah masa aktif berakhir, bab berbayar kembali terkunci. Riwayat nilai dan sertifikat tetap tersimpan.</li>
            </ul>
          ),
        },
        {
          id: "pembayaran",
          title: "Pembayaran dan pengembalian dana",
          body: (
            <ul>
              <li>Harga yang berlaku adalah harga saat pesanan dibuat, termasuk potongan voucher.</li>
              <li>Pesanan yang tidak dibayar sampai batas waktu otomatis kedaluwarsa.</li>
              <li>Pengembalian dana dapat diajukan dalam 3 hari sejak pembayaran jika belum ada materi berbayar yang dibuka.</li>
            </ul>
          ),
        },
        {
          id: "tryout",
          title: "Tryout",
          body: (
            <ul>
              <li>Waktu tryout dihitung oleh server. Jawaban yang dikirim setelah waktu habis tidak dinilai.</li>
              <li>Aktivitas selama tryout, seperti pindah tab, dicatat dan dapat ditinjau admin.</li>
              <li>Soal dan pembahasan hanya untuk dipelajari sendiri dan tidak boleh disebarluaskan.</li>
            </ul>
          ),
        },
        {
          id: "konten",
          title: "Hak atas konten",
          body: (
            <p>
              Seluruh video, soal, pembahasan, dan materi PDF adalah milik Taman Pelajar. Mengunduh PDF untuk
              dipelajari sendiri diperbolehkan; menjual atau membagikannya ulang tidak.
            </p>
          ),
        },
        {
          id: "perubahan",
          title: "Perubahan ketentuan",
          body: (
            <p>
              Kami dapat memperbarui ketentuan ini. Perubahan penting diberitahukan lewat notifikasi dan email
              setidaknya 7 hari sebelum berlaku.
            </p>
          ),
        },
      ]}
    />
  );
}
