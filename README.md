# Taman Pelajar

Aplikasi bimbingan belajar online: kelas online, video pembelajaran, penjualan paket belajar, tryout CBT dengan hasil dan pembahasan, dashboard siswa, dan panel administrator.

Spesifikasi lengkap ada di [CLAUDE.md](CLAUDE.md). Arsitektur, rancangan database, dan sitemap ada di [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md). Progres per tahap ada di [docs/PROGRESS.md](docs/PROGRESS.md).

## Teknologi

- Next.js 16 (App Router, Cache Components), TypeScript strict
- Tailwind CSS v4, shadcn/ui, Lucide
- Prisma 7 + MySQL 8 (produksi); lokal memakai MariaDB 10.4 bawaan XAMPP
- Auth.js v5, Cloudinary, Midtrans (dengan mode simulasi)
- Vitest dan Playwright

## Prasyarat

- Node.js 22 atau lebih baru
- pnpm 11 (`corepack enable`)
- XAMPP dengan MySQL berjalan di port 3306. Proyek ini tidak memakai Docker.

## Instalasi lokal

1. Buat database `tamanpelajar` di phpMyAdmin dengan collation `utf8mb4_unicode_ci`.
2. Salin `.env.example` menjadi `.env`, lalu isi minimal `DATABASE_URL`, `AUTH_SECRET`, dan `NEXT_PUBLIC_APP_URL`.
   - `AUTH_SECRET` bisa dibuat dengan `npx auth secret`.
3. Pasang dependensi. Langkah ini sekaligus membuat Prisma Client.
   ```bash
   pnpm install
   ```
4. Terapkan migration dan isi data demo.
   ```bash
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```
5. Jalankan aplikasi di http://localhost:3000.
   ```bash
   pnpm dev
   ```

Seed bisa dijalankan ulang kapan saja. Semua tabel dikosongkan lalu diisi kembali. Setelah seed ulang, restart `pnpm dev` agar data katalog yang di-cache ikut diperbarui.

## Akun demo

| Role | Email | Password |
|---|---|---|
| Admin | admin@tamanpelajar.test | Demo12345! |
| User | user1@tamanpelajar.test … user5@tamanpelajar.test | Demo12345! |

Isi data demo:

| User | Isi |
|---|---|
| user1 | Paket SKD aktif, dua percobaan tryout, progres kelas TWK |
| user2 | Paket UTBK aktif, sertifikat Penalaran Umum, dan tugas praktik Pengetahuan Kuantitatif yang menunggu penilaian admin |
| user3 | Tryout SKD |
| user4 | Belum membeli; ada pesanan yang menunggu pembayaran |
| user5 | Paket TPA yang masa aktifnya sudah berakhir |

## Perintah

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Server development |
| `pnpm build` | Build produksi. Membutuhkan database karena halaman publik di-prerender dari data |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |
| `pnpm test` | Tes unit Vitest (penilaian, mesin ujian, voucher, Midtrans, akses) |
| `pnpm test:e2e` | Tes Playwright terhadap build produksi (build + `next start` otomatis). Jalankan `pnpm prisma db seed` dulu dan pastikan port 3000 kosong. `E2E_DEV=1` memakai server dev. Unduh browser sekali dengan `pnpm exec playwright install chromium` |
| `pnpm prisma migrate dev` | Membuat dan menerapkan migration |
| `pnpm prisma db seed` | Mengisi data demo (termasuk PDF ringkasan materi ke Cloudinary bila dikonfigurasi) |
| `pnpm seed:video` | Membuat dan mengunggah video contoh orisinal per kelas ke Cloudinary (sekali saja, butuh Chromium Playwright) |
| `pnpm prisma studio` | Melihat isi database |

## Cloudinary

Semua file (gambar, PDF materi, sertifikat) disimpan di Cloudinary.

- Isi variabel `CLOUDINARY_*` dan `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` di `.env`.
- Akun gratis Cloudinary memblokir pengiriman PDF dan ZIP secara bawaan. Aktifkan **Settings → Security → Allow delivery of PDF and ZIP files** agar PDF materi bisa diunduh.

## Sertifikat dan tugas praktik

- Setiap kelas bersertifikat punya **batch** (atur di Admin → Kelas → tab Batch). Siswa yang berlangganan otomatis masuk batch yang sedang berjalan. Kelas tanpa batch tidak menampilkan bagian sertifikat.
- Syarat sertifikat: semua materi selesai, rata-rata nilai terbaik setiap kuis kelas mencapai nilai minimal (Admin → Sertifikat, bawaan 80), lalu tugas praktik berupa link Google Drive disetujui admin (Admin → Tugas Praktik).
- Admin bisa menyetujui, meminta revisi sekali, atau menolak. Siswa yang gagal mengulang gratis di batch berikutnya dengan progres dari awal.
- Template tugas (PDF, DOCX, atau ZIP) diunggah ke Cloudinary dan hanya bisa diunduh peserta batch.

## Email

`MAIL_MODE="log"` (bawaan) mencetak email ke log server dan menampilkan tautan verifikasi/reset di halaman, cukup untuk demo. Email hasil tugas praktik juga dicetak ke log. Pengiriman sungguhan (SMTP atau penyedia email) belum disambungkan.

## Login Google (opsional)

Isi `AUTH_GOOGLE_ID` dan `AUTH_GOOGLE_SECRET` dari Google Cloud Console (OAuth client "Web application") dengan redirect URI `<NEXT_PUBLIC_APP_URL>/api/auth/callback/google`. Tombol "Masuk dengan Google" hanya tampil bila keduanya terisi.

## Pembayaran

- Bawaan `PAYMENT_MODE="simulasi"`: semua metode (VA, QRIS, e-wallet, transfer) disimulasikan. Di halaman transaksi ada tombol **Bayar sekarang (simulasi)** dan **Gagalkan pembayaran**; tidak ada uang yang ditarik.
- Voucher demo: `HEMAT10` (10%, maks. Rp50.000) dan `BELAJAR25` (Rp25.000, minimal Rp200.000), masing-masing sekali per akun.
- Midtrans: isi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`, lalu `PAYMENT_MODE="midtrans"`. Daftarkan URL notifikasi `https://<domain>/api/webhooks/midtrans` di dashboard Midtrans. Webhook memverifikasi signature SHA512 dan nominal sebelum mengaktifkan paket.

## Deploy ke Vercel

1. Siapkan database MySQL 8 terkelola, misalnya PlanetScale, Aiven for MySQL, atau TiDB Cloud.
   - Jika host tidak mendukung foreign key, tambahkan `relationMode = "prisma"` di `datasource`. Semua relasi sudah memiliki `@@index`.
2. Isi semua variabel `.env.example` di Project Settings → Environment Variables. Untuk produksi:
   - `AUTH_URL` dan `NEXT_PUBLIC_APP_URL` diisi domain produksi.
   - `PAYMENT_MODE` diisi `midtrans` jika pembayaran sungguhan sudah siap.
3. Terapkan migration ke database produksi sebelum build pertama:
   ```bash
   pnpm prisma migrate deploy
   ```
   Build Vercel membaca database saat prerender, jadi `DATABASE_URL` harus bisa diakses dari Vercel.
4. Atur `NEXT_PUBLIC_APP_URL` ke domain produksi agar `sitemap.xml`, `robots.txt`, URL kanonis, dan Open Graph memakai domain yang benar.

## Masalah umum

- **Tidak bisa masuk di satu browser setelah seed ulang.** Seed membuat ulang semua akun, jadi cookie sesi lama tidak berlaku. Aplikasi otomatis menghapusnya dan menampilkan pesan "Sesimu sudah tidak berlaku"; cukup masuk lagi.
- **Data katalog tidak berubah setelah seed ulang.** Restart server agar cache halaman publik dimuat ulang.
- **E2E dan mode pembayaran.** Playwright selalu menjalankan server tes dengan `PAYMENT_MODE=simulasi`, walau `.env` memakai Midtrans. Pastikan port 3000 kosong sebelum `pnpm test:e2e`.
