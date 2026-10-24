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
| user2 | Paket UTBK aktif dan satu sertifikat |
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
| `pnpm test` | Tes unit Vitest (penilaian, filter katalog) |
| `pnpm test:e2e` | Tes Playwright. Unduh browser sekali dengan `pnpm exec playwright install chromium` |
| `pnpm prisma migrate dev` | Membuat dan menerapkan migration |
| `pnpm prisma db seed` | Mengisi data demo (termasuk PDF ringkasan materi ke Cloudinary bila dikonfigurasi) |
| `pnpm seed:video` | Membuat dan mengunggah video contoh orisinal per kelas ke Cloudinary (sekali saja, butuh Chromium Playwright) |
| `pnpm prisma studio` | Melihat isi database |

## Cloudinary

Semua file (gambar, PDF materi, sertifikat) disimpan di Cloudinary.

- Isi variabel `CLOUDINARY_*` dan `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` di `.env`.
- Akun gratis Cloudinary memblokir pengiriman PDF dan ZIP secara bawaan. Aktifkan **Settings → Security → Allow delivery of PDF and ZIP files** agar PDF materi bisa diunduh.

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
