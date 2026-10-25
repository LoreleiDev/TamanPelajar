# Progres Taman Pelajar

Centang nomor butir Lampiran `CLAUDE.md` yang selesai. Setiap tahap dicatat dengan branch, tanggal, dan hasil tes.

## Tahap 0 — Persiapan (`feat/setup-awal`, 24 Oktober 2026)

- [x] **T.19 / S.1** Arsitektur aplikasi, struktur database, sitemap, dan daftar komponen di `docs/ARSITEKTUR.md`
- [x] Inisialisasi Next.js 16.4 (App Router, TypeScript strict, `src/`), pnpm 11
- [x] Tailwind CSS v4 (loader `@tailwindcss/turbopack`) + shadcn/ui (Radix, preset Nova) + Lucide
- [x] Prisma 7.10.1 (versi stabil; tag `latest` npm saat ini RC 8.0) dengan `provider = "mysql"`, adapter `@prisma/adapter-mariadb`, `prisma.config.ts`, client di `src/generated/prisma` (tidak di-commit, dibuat oleh `postinstall`)
- [x] `.env.example` sesuai CLAUDE.md (**P.3**)
- [x] Script `dev`, `build`, `lint`, `typecheck`, `test` (Vitest), `test:e2e` (Playwright), `db:migrate`, `db:seed`, `db:studio`
- [x] Token warna B.1.2–B.1.4, B.1.12 di `src/app/globals.css` (`primary`, `olive`, `leaf`, `bark`, `muted`/`border`, `foreground`, plus `success`/`destructive`/`warning` untuk status); hover tombol utama ±10% lebih gelap
- [x] Font Plus Jakarta Sans via `next/font`, radius 12–20 px, shadow lembut, `prefers-reduced-motion`
- [x] Metadata dasar Bahasa Indonesia (`lang="id"`, title template, Open Graph `id_ID`)
- [x] Logo: tanda tunas dari `brand/logo.jpeg` disalin ke `public/logo-taman-pelajar.jpeg` (juga `src/app/icon.jpg` dan gambar Open Graph). Tulisan "TAMAN PELAJAR" dirender sebagai teks HTML di `src/components/layout/logo.tsx` mengikuti `brand/reference.jpeg`. TODO: ganti bila ada logo lengkap (tunas + tulisan)
- [ ] Koneksi MySQL lokal: belum diuji karena service `MySQL80` belum berjalan dan `.env` belum diisi. Dicek di awal Tahap 2 (migration pertama)

**Hasil tes:** `pnpm lint` lulus, `pnpm typecheck` lulus, `pnpm test` 2/2 lulus, `pnpm build` lulus, `pnpm test:e2e` 2/2 lulus (desktop 1440 dan mobile 375).

**Review visual:** halaman sementara di 1440, 1024, 768, 375 px; tanpa error console; dicek terhadap daftar "Dilarang" (tanpa gradient ungu, glow, emoji, atau angka palsu).

**Catatan teknis:**
- Next.js 16 mengganti `middleware.ts` menjadi `proxy.ts`. Proteksi route akan ditulis di `src/proxy.ts`.
- `next.config.ts` bawaan (`cacheComponents`, `partialPrefetching`, `agentFeedback`) dipertahankan.

## Tahap 1 — Design system, layout, beranda, katalog, detail paket (24 Oktober 2026)

Lima branch, masing-masing di-squash ke `main` setelah lint, typecheck, test, dan build lulus.

### `feat/B1-design-system`
- [x] **B.1** Token dari Tahap 0 dan skala tipografi (`text-display`, `text-title`, `text-heading`, `text-lead`) serta `page-container`
- [x] Halaman `/style-guide` (404 di produksi): warna, tipografi, tombol, form, kartu paket, badge, tabel, empty state, skeleton, ornamen, dialog, toast
- [x] Komponen bersama:
  - `ProductCard` + skeleton, `ProductCover`, `PriceTag`, `Rating`
  - `CheckList`, `GrowthProgress`, `EmptyState`, `ConfirmDialog`, `JsonLd`
  - Ornamen `SproutMark`, `SproutDivider`, `OrganicCorners`, `DotPattern`
- [x] **C.5.3–C.5.4** `LoginRequiredProvider` + `useRequireLogin()`: dialog "Masuk dulu" dengan `callbackUrl`
- [x] **P.2.3–P.2.6** Empty state, skeleton, toast (sonner, tema terang), confirmation dialog
- [x] Komponen shadcn yang dipasang:
  - Teks diterjemahkan ke Bahasa Indonesia, dan overlay dibuat tanpa blur.
  - Ukuran tombol, input, dan badge disesuaikan untuk layar sentuh.
  - Carousel Embla dihapus karena tidak lolos lint React 19 dan tidak diperlukan.
- [x] **A.6** Data katalog contoh bertipe (`features/catalog/mock-data.ts`). `queries.ts` diganti Prisma di Tahap 2 dengan tanda tangan fungsi yang sama.

### `feat/B2-layout`
- [x] **B.2.1–B.2.3, B.2.6** Navbar sticky: logo, 6 menu dengan status aktif, pencarian (form GET ke katalog), Masuk/Daftar. **B.2.4–B.2.5** (notifikasi, foto dan nama pengguna) menyusul bersama sesi di Tahap 2
- [x] **B.3.1–B.3.2** Menu hamburger (sheet) dan bottom nav mobile. Transaksi dan Profil memunculkan dialog masuk untuk tamu
- [x] **D.1.9** Footer: kolom produk, bantuan, kontak, baris kontak bergaya logo, wordmark selebar halaman
- [x] Halaman tentang, bantuan, kontak, kebijakan privasi, syarat dan ketentuan (teks orisinal)
- [x] **P.2.7–P.2.8** `not-found.tsx` dan `error.tsx` khusus
- [x] **T.16** Halaman sementara untuk `/tryout`, `/video`, `/kelas`, `/informasi`, `/masuk`, `/daftar`, berisi penjelasan dan tautan ke halaman yang sudah jalan

### `feat/D1-beranda`
- [x] **D.1.1** Hero gradient `#3F7042 → #718A35`, judul kapital, tombol "Mulai belajar" dan "Lihat tryout", angka siswa/kelas/soal dari data. Di kanan ada soal CBT contoh yang bisa dijawab langsung, dengan status benar/salah lewat warna, ikon, dan teks. TODO: ilustrasi pelajar
- [x] **D.1.2** Menu belajar cepat (4 pill)
- [x] **D.1.3** Tujuh program sebagai daftar satu ukuran huruf
- [x] **D.1.4** Pencarian paket langsung + 3 paket rekomendasi
- [x] **D.1.5** Lima keunggulan
- [x] **D.1.6** Statistik dari data (5 siswa, 6 kelas, 30 soal, 9 tryout selesai)
- [x] **D.1.7** Testimoni berbentuk surat dengan tombol geser
- [x] **D.1.8** FAQ `<details>`
- [x] Penutup "Coba dua bab pertama gratis"
- [x] **Q.2.6** JSON-LD `WebSite` + `SearchAction`

### `feat/D2-katalog`
- [x] **D.2.1** Pencarian
- [x] **D.2.2** Filter program, jenis, jenjang, harga, dan rating, berupa form GET (`next/form`). Di desktop otomatis diterapkan, di mobile lewat sheet. Chip filter aktif bisa dihapus
- [x] **D.2.3** Urutan terpopuler, terbaru, termurah, termahal
- [x] **D.2.4** Grid responsif
- [x] **D.2.5** Pagination (9 per halaman)
- [x] Kerangka statis dengan hasil di-stream dalam `Suspense` dan skeleton kartu (partial prerender). Parser URL membuang nilai yang tidak dikenal
- Catatan sitemap: halaman per program memakai `/program?kategori=<slug>`, bukan `/program/[kategori]`

### `feat/D3-detail-paket`
- [x] **D.3.1** Banner dan breadcrumb
- [x] **D.3.2** Deskripsi
- [x] **D.3.3** Harga, diskon, masa aktif
- [x] **D.3.4** Fitur
- [x] **D.3.5** Silabus per kelas: bab 1–2 berlabel "Gratis setelah masuk", bab lain bergembok dan berteks
- [x] **D.3.6** Tabel kelas dan tryout
- [x] **D.3.8** Rating dan ulasan
- [x] **D.3.9** FAQ
- [x] **D.3.10** Panel beli sticky di desktop
- [x] **D.3.11** Paket serupa
- [x] **Q.2.1–Q.2.2, Q.2.6** Metadata per paket, JSON-LD `Course` dengan `Offer` dan `AggregateRating`. Semua halaman paket di-prerender lewat `generateStaticParams`

**Hasil tes akhir:**
- `pnpm lint` dan `pnpm typecheck`: lulus
- `pnpm test`: 12/12 lulus
- `pnpm build`: lulus
- `pnpm test:e2e`: 29 lulus, 5 dilewati karena khusus desktop atau mobile

**Review visual:**
- Cakupan: screenshot Playwright di 1440, 1024, 768, dan 375 px untuk `/style-guide`, `/masuk`, `/tentang`, `/kebijakan-privasi`, `/tryout`, 404, `/`, `/program` (tanpa filter, dengan filter, kosong), serta `/paket/[slug]` (bundel, tryout, tidak ada). Tidak ada error console dan tidak ada scroll horizontal.
- Perbaikan dari review:
  - Ukuran input dan badge; tunas progres di 100%.
  - Footer tertutup bottom nav.
  - Judul hero dari 4 baris menjadi 3 baris; `<legend>` pada soal contoh.
  - Penanda kolom pencarian besar; teks isi diubah ke tinta penuh.
  - Sampul paket disembunyikan di mobile agar harga terlihat di layar pertama.
- Arah desain dari skill `design-taste-frontend`: `type-only-statement` (seed 142337908), dengan palet dan font dikunci brand.
- Pemeriksa sumber `lint.mjs`: 0 FAIL untuk kode proyek.
- `inspect.mjs` pada beranda menyisakan temuan yang sengaja tidak diikuti karena CLAUDE.md:
  - judul hero dari brief menjadi 3 baris
  - gradient hero
  - border tipis
  - tanpa foto, video, atau animasi masuk

**Data contoh dan konten yang perlu dikonfirmasi sebelum rilis:**
- Harga, isi, dan ulasan paket di `mock-data.ts` (dipindah ke seed di Tahap 2)
- Akun media sosial dan email `halo@tamanpelajar.com` di footer dan halaman kontak
- Teks kebijakan privasi serta syarat dan ketentuan perlu ditinjau pihak yang berwenang

## Tahap 2 — Autentikasi, database, dashboard, kelas, video (24 Oktober 2026)

Lima branch fitur dan dua branch perbaikan, masing-masing di-squash ke `main` setelah lint, typecheck, test, build, dan e2e lulus.

### `feat/N-skema-database`
- [x] **N.1–N.7** Skema Prisma 56 model sesuai `ARSITEKTUR.md` §2; migration `20261024081425_init`
- [x] **N.8.1–N.8.7** id cuid, `createdAt`/`updatedAt`, foreign key, `@@index`, unique, soft delete (User, Course, Product, Exam, Question, Order), enum status
- [x] **O.1–O.6** Seed yang bisa diulang (TRUNCATE lalu isi): 1 admin + 5 siswa, 4 program, 6 kelas (bab 1–2 gratis), 30 soal orisinal untuk 6 jenis, 3 tryout masing-masing 2 subtes, 12 paket, pesanan, enrollment, hasil demo, progres, sertifikat, ulasan, notifikasi, testimoni, artikel, voucher
- [x] **J.1.1–J.1.6** `features/scoring/score.ts`: fungsi murni penilaian (benar, salah nol/negatif, kosong 0, bobot soal dan subtes, passing grade) dengan tes unit
- [x] **A.6** Katalog, beranda, dan detail paket membaca Prisma; `mock-data.ts` dihapus

### `feat/E-autentikasi`
- [x] **E.1.1–E.1.6** Daftar, masuk, lupa password, reset password, verifikasi email, lengkapi profil
- [x] **E.2.1–E.2.7** Semua field pendaftaran, **E.3.1–E.3.4** validasi Zod, pesan per field, indikator kekuatan, tampilkan password
- [x] **E.3.5** Google OAuth (aktif bila `AUTH_GOOGLE_ID` diisi), **E.3.6–E.3.7** kunci akun setelah 5 gagal dalam 15 menit dan rate limit di tabel `RateLimit`, **E.3.8** sesi JWT di cookie HTTP-only
- [x] **C.4, P.1.8** `src/proxy.ts` + `requireRole()`/`requireOwnership()` di `lib/rbac.ts`
- [x] **B.2.4–B.2.5** Navbar dengan notifikasi dan menu akun
- Email memakai `MAIL_MODE=log`: tautan verifikasi dan reset ditampilkan sebagai tautan demo, belum dikirim

### `feat/G-kelas`
- [x] **G.1** Sidebar kurikulum dengan bab, materi, jenis, status selesai, gembok
- [x] **G.2.1–G.2.7** Player, deskripsi, lampiran PDF, sebelumnya/berikutnya, tandai selesai, catatan, diskusi
- [x] **G.3** Panel progres, **G.4.1–G.4.9** progres otomatis, resume video, urutan, unduh PDF (signed URL 5 menit), kuis, sertifikat, pencarian, bookmark, riwayat aktivitas
- [x] **G.4.10–G.4.12, C.5.5, K.5** `canAccessLesson()` di `lib/access.ts`: tamu ditolak, bab gratis untuk user login, bab lain butuh enrollment aktif; URL video/PDF bab terkunci tidak dikirim ke client; dialog ajakan berlangganan
- [x] **C.1.9** Halaman sertifikat yang bisa dicetak di `/sertifikat/[nomor]`

### `feat/H-video`
- [x] **H.1** Pustaka video dengan filter kategori, mata pelajaran, durasi, tingkat, status tonton
- [x] **H.2.1–H.2.8** Player, deskripsi, transkrip, materi terkait, catatan, simpan, sebelumnya/berikutnya, progres tontonan
- Video contoh dibuat sendiri (`pnpm seed:video`, animasi kanvas 24 detik) dan diunggah ke Cloudinary. TODO: ganti dengan video pembelajaran asli

### `feat/F-dashboard`
- [x] **F.1** Sidebar 11 menu (tab geser di mobile) dengan jumlah notifikasi belum dibaca
- [x] **F.2.1–F.2.10** Sapaan, program aktif, progres, jadwal tryout, kelas terakhir, nilai terbaru, rata-rata, waktu belajar, aktivitas, rekomendasi
- [x] **F.3.1–F.3.4** Grafik Recharts dengan tabel data alternatif; palet hijau brand divalidasi dengan skrip skill `dataviz`
- [x] **J.2.1–J.2.8** Halaman Analisis Kemampuan: nilai per topik, penguasaan, kecepatan, akurasi, mudah/sedang/sulit, antarpercobaan, rata-rata peserta, rekomendasi
- [x] Kelas Saya, Video Saya, Tryout Saya, Riwayat Hasil, Transaksi, Sertifikat, Notifikasi, Profil (ubah data dan ganti password)

### Perbaikan
- `fix/konflik-merge-autentikasi`: lima berkas berisi penanda konflik dari commit "p" di `main` dipulihkan dari versi yang sudah diuji
- `fix/D1-hero-tanpa-soal`: kartu soal CBT di hero beranda diganti ilustrasi tunas SVG (revisi RMED); form autentikasi memakai `method="post"` dan tombol nonaktif sebelum hydration agar kredensial tidak masuk URL

**Pengujian (akhir tahap):**
- `pnpm lint`, `pnpm typecheck`, `pnpm build` lulus; `pnpm test` 25/25
- `pnpm test:e2e` 71/71 lulus dua kali berturut-turut (desktop + mobile): autentikasi, kelas, video, dashboard, dan alur Tahap 1
- Kriteria yang sudah tercakup: **T.1**, **T.4**, **T.5**, **T.17**, **T.18** (bagian bab gratis dan bab berlangganan; pembayaran Midtrans menyusul di Tahap 4)

**Review visual:** screenshot 1440, 1024, 768, 375 px untuk halaman autentikasi, kelas, ruang belajar, video, sertifikat, dan 10 halaman dashboard. Tidak ada error console dan tidak ada scroll horizontal. Perbaikan dari review: grid dashboard meluber karena teks `sr-only` di tab geser, label sumbu "100%" terpotong, teks "naik 0 poin" menjadi "tetap".

**Catatan:**
- Database lokal MariaDB 10.4 (XAMPP); skema tetap ditulis untuk MySQL 8. Prisma 7.10.1 dengan `@prisma/adapter-mariadb`
- `/transaksi` sementara dialihkan ke `/dashboard/transaksi` (lewat `next.config.ts`) sampai halaman transaksi dibangun di Tahap 4
- Verifikasi sertifikat memakai `/sertifikat/[nomor]`, bukan `/sertifikat/verifikasi/[nomor]`
- Halaman daftar dan pengerjaan tryout dibangun di Tahap 3; balasan diskusi oleh admin (**L.2.8**) di Tahap 5
- Di server dev kadang muncul peringatan hydration saat beban tinggi; tidak muncul di build produksi

## Tahap 3 — Tryout CBT (25 Oktober 2026)

Dua batch, masing-masing di-squash ke `main`. Sesuai arahan RMED, pengujian lengkap (fitur baru + regresi seluruh e2e) dijalankan sekali di akhir setiap batch, lalu push.

### `feat/I-ujian-cbt` (batch A)
- [x] **I.1** Daftar tryout: nama, kategori, jumlah soal, durasi, jadwal, percobaan, status, nilai tertinggi, tombol mulai/lanjutkan
- [x] **I.2** Petunjuk: durasi, jumlah soal, tabel subtes, sistem penilaian, aturan, batas percobaan, checkbox persetujuan, "Mulai Tryout". Tamu melihat dialog masuk; tanpa paket ditawari paket yang mencakup tryout
- [x] **I.3.1–I.3.4** Halaman `/ujian/[attemptId]` tanpa navbar utama: nama tryout, nomor soal, timer, keluar; soal di kiri, panel nomor di kanan (sheet bawah di mobile); opsi A–E sebagai kartu; ragu-ragu, sebelumnya, berikutnya, simpan jawaban; status nomor dibedakan warna dan ikon
- [x] **I.4.1–I.4.4** Timer dari `deadlineAt` server (selisih jam perangkat dikoreksi), autosave debounce 1 detik dengan simpan ulang saat jaringan putus, soal aktif dan jawaban pulih setelah refresh
- [x] **I.4.5–I.4.9** Peringatan 10/5/1 menit, auto-submit, konfirmasi dengan jumlah soal kosong dan ragu, submit idempoten (`updateMany` bersyarat dalam transaksi), server menolak jawaban setelah batas waktu (toleransi jaringan 2 detik) dan mengumpulkan percobaan kedaluwarsa saat diakses
- [x] **I.4.10–I.4.12** Tombol layar penuh, deteksi pindah tab, log aktivitas (`ExamActivityLog`)
- [x] **I.4.13–I.4.15** Acak soal dan opsi dari seed tersimpan; subtes berurutan dengan durasi sendiri, subtes berikutnya mulai saat subtes sebelumnya ditutup atau habis waktunya
- [x] **I.5.1–I.5.6** Pilihan ganda tunggal/jamak, benar-salah, isian singkat, numerik (koma desimal), essay
- [x] **J.1.1–J.1.6** Penilaian di server memakai `features/scoring`; kunci jawaban tidak pernah dikirim ke halaman ujian
- [x] **P.1.4** Rate limit mulai, simpan jawaban, kumpulkan, dan log aktivitas

### `feat/I6-hasil-pembahasan` (batch B)
- [x] **I.6.1–I.6.11** Hasil: nilai akhir dan per subtes, benar/salah/kosong, waktu, peringkat dan persentil (nilai terbaik tiap peserta), rata-rata peserta, passing grade dan status, radar kemampuan, nilai per topik dibanding rata-rata, rekomendasi kelas dan video, tombol pembahasan dan ulangi tryout
- [x] **I.7.1–I.7.8** Pembahasan: urutan sama seperti saat dikerjakan, jawaban siswa dan kunci, status dengan ikon dan teks, pembahasan, video pembahasan (embed YouTube/Vimeo), topik dan tingkat, sebelumnya/berikutnya, navigasi semua nomor (`?soal=n`)
- [x] **J.2.1–J.2.8** Analisis per topik, akurasi dan kecepatan per tingkat kesulitan, perbandingan dengan rata-rata peserta, rekomendasi dari topik di bawah 70%
- [x] **M.6.5** Pembahasan hanya terbuka bila `showDiscussion` dan `discussionOpensAt` mengizinkan; **P.1.9** hasil dan pembahasan hanya untuk pemilik percobaan (atau admin)
- [x] Tautan riwayat, aktivitas dashboard, notifikasi, dan petunjuk mengarah ke halaman hasil

**Pengujian (akhir tahap):**
- `pnpm lint`, `pnpm typecheck`, `pnpm build` lulus; `pnpm test` 39/39 (tambahan: mesin ujian, jadwal subtes, syarat mulai, peringkat)
- `pnpm test:e2e` 79/79 lulus dua kali berturut-turut (desktop + mobile), termasuk `e2e/tryout.spec.ts`: tamu, tanpa paket, alur lengkap mulai–autosave–refresh–subtes–kumpulkan–hasil–pembahasan, akses peserta lain ditolak, dan waktu habis
- Kriteria yang sekarang tercakup: **T.6–T.11**
- Akun `e2e-tryout-desktop/mobile@tamanpelajar.test` dibuat ulang oleh `e2e/reset-db.ts` dengan langganan semua paket tryout; global setup memanaskan rute berat di server dev sebelum tes paralel

**Review visual:** screenshot 1440, 1024, 768, 375 px untuk daftar tryout, petunjuk, halaman ujian, hasil, dan pembahasan. Tidak ada error console dan tidak ada scroll horizontal. Perbaikan dari review: header ujian di mobile diringkas, tombol sebelumnya/berikutnya dipindah ke bar bawah di mobile, sheet daftar soal ditutup saat dialog konfirmasi dibuka, label skala radar dihapus karena menabrak nama topik, batang 0% diberi ukuran minimum, teks legenda grafik memakai warna tinta.

**Catatan:**
- Essay tercatat "menunggu penilaian"; penilaian essay oleh admin (**L.2.7**) dan preview tryout (**M.6.9**) di Tahap 5
- Setelah `pnpm db:seed`, hapus `.next/dev` atau mulai ulang server dev: data `use cache` menyimpan ID lama
- MariaDB XAMPP harus berjalan sebelum build dan e2e (build membaca data tryout untuk `generateStaticParams`)

## Tahap 4 — Keranjang, checkout, pembayaran

Belum dimulai.

## Tahap 5 — Panel administrator

Belum dimulai.

## Tahap 6 — Pengujian dan penyempurnaan

Belum dimulai.
