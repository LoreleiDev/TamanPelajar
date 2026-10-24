import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Pusat bantuan",
  description: "Jawaban untuk pertanyaan seputar akun, pembayaran, kelas, dan tryout di Taman Pelajar.",
};

const link = "font-semibold text-primary underline underline-offset-4";

export default function BantuanPage() {
  return (
    <InfoPage
      title="Pusat bantuan"
      intro="Panduan singkat untuk masalah yang paling sering ditanyakan. Jika belum terjawab, hubungi kami lewat halaman kontak."
      sections={[
        {
          id: "akun",
          title: "Akun dan masuk",
          body: (
            <ul>
              <li>Lupa password: pilih “Lupa password” di halaman masuk, lalu ikuti tautan yang dikirim ke email Anda.</li>
              <li>Email verifikasi tidak masuk: periksa folder spam, lalu kirim ulang dari halaman verifikasi email.</li>
              <li>Akun terkunci sementara: terjadi setelah beberapa kali salah password. Tunggu 15 menit lalu coba lagi.</li>
            </ul>
          ),
        },
        {
          id: "pembayaran",
          title: "Pembayaran dan aktivasi paket",
          body: (
            <ul>
              <li>Metode yang tersedia: virtual account, QRIS, e-wallet, dan transfer bank.</li>
              <li>Paket aktif otomatis setelah pembayaran terverifikasi, biasanya dalam beberapa menit.</li>
              <li>Batas pembayaran tertulis di halaman transaksi. Pesanan yang lewat batas otomatis kedaluwarsa dan bisa dibuat ulang.</li>
              <li>Invoice bisa dicetak atau disimpan sebagai PDF dari halaman transaksi.</li>
            </ul>
          ),
        },
        {
          id: "kelas",
          title: "Kelas dan video",
          body: (
            <ul>
              <li>Bab bergembok berarti materi itu termasuk paket berbayar. Bab 1 dan 2 terbuka gratis setelah masuk.</li>
              <li>Video tidak bisa diputar: muat ulang halaman, lalu periksa koneksi internet. Posisi terakhir tetap tersimpan.</li>
              <li>Sertifikat terbit otomatis setelah semua materi dalam kelas ditandai selesai.</li>
            </ul>
          ),
        },
        {
          id: "tryout",
          title: "Tryout",
          body: (
            <ul>
              <li>Jawaban tersimpan otomatis setiap kali dipilih. Jika halaman tertutup, buka lagi tryout yang sama untuk melanjutkan.</li>
              <li>Timer tetap berjalan meskipun halaman ditutup, sesuai waktu mulai yang tercatat di server.</li>
              <li>Saat waktu habis, jawaban dikumpulkan otomatis.</li>
            </ul>
          ),
        },
        {
          id: "lainnya",
          title: "Masih butuh bantuan",
          body: (
            <p>
              Kirim pertanyaan lewat <Link href="/kontak" className={link}>halaman kontak</Link>. Sertakan email akun
              dan nomor pesanan jika berkaitan dengan pembayaran.
            </p>
          ),
        },
      ]}
    />
  );
}
