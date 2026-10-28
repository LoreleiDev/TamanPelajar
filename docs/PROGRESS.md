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

## Tahap 4 — Keranjang, checkout, pembayaran (25 Oktober 2026)

Dua batch, masing-masing di-squash ke `main` setelah lint, typecheck, unit, build, dan seluruh e2e lulus dua kali berturut-turut. Atas permintaan RMED, batch ini juga diisi perburuan bug dan perbaikan konsistensi desain.

### `feat/K-keranjang-checkout`
- [x] **K.1** Alur pilih paket → keranjang → voucher → periksa pesanan → metode → bayar → verifikasi → aktivasi. Tombol Beli sekarang memasukkan paket ke keranjang (tamu melihat dialog masuk); navbar punya ikon keranjang dengan jumlah
- [x] **K.2.1–K.2.5** Virtual account (BCA, BNI, BRI, Mandiri, Permata), QRIS, e-wallet, transfer bank, dan mode simulasi (`PAYMENT_MODE=simulasi`, bawaan)
- [x] **K.3** Detail transaksi `/transaksi/[nomor]`: nomor, produk, harga, diskon, total, metode, batas bayar, status, tombol bayar, invoice, batalkan pesanan
- [x] **K.4** Invoice `/invoice/[nomor]` yang bisa dicetak atau disimpan sebagai PDF
- [x] **K.5, A.4** `PaymentProvider` di `lib/payment.ts` (simulasi dan Midtrans Snap). Webhook `/api/webhooks/midtrans` memverifikasi signature SHA512 dan nominal. `activateOrder()` idempoten dan hanya dari status BERHASIL; langganan aktif diperpanjang dari tanggal berakhirnya
- [x] Voucher: persen dengan potongan maksimal, nominal, minimum belanja, kuota, batas per pengguna, masa berlaku. Kuota dikembalikan bila pesanan gagal, kedaluwarsa, atau dibatalkan. Pesanan lewat 24 jam ditandai kedaluwarsa otomatis
- [x] Tes unit harga, voucher, nomor pesanan, perpanjangan masa aktif, signature dan status Midtrans; e2e `checkout.spec.ts` (beli dengan voucher, bayar simulasi, bab 3 terbuka, invoice, batalkan, gagalkan, akses pengguna lain ditolak, webhook tanpa signature ditolak)

**Bug yang ditemukan dan diperbaiki:**
- Checkout dari dua tab bersamaan bisa membuat dua pesanan; kuota voucher bisa terlampaui oleh checkout bersamaan (snapshot InnoDB REPEATABLE READ diambil sebelum kunci). Baris keranjang dan voucher kini dikunci `FOR UPDATE` sebelum pembacaan pertama. Diuji langsung ke database dengan skrip race: 1 pesanan dari 2 checkout, 1 pemakaian dari kuota 1, 1 aktivasi dari 3 klaim bersamaan
- Perpanjangan masa aktif bisa hilang bila dua pesanan produk sama dibayar bersamaan; enrollment kini dibaca dengan kunci baris
- Slug yang tidak ada di `/paket`, `/tryout`, `/video`, `/kelas`, `/sertifikat` mengembalikan 200 (soft 404) di build produksi karena halaman sudah mulai streaming. Proxy kini memeriksa keberadaan slug lebih dulu (`lib/route-exists.ts`) dan membalas 404 asli
- Teks yang diketik di form masuk/daftar/profil sebelum hydration selesai dihapus oleh React Hook Form; input kini nonaktif (`fieldset disabled`) sampai hydration
- Teks di kolom pencarian navbar hilang saat data akun selesai di-stream karena seluruh header di-render ulang; kini hanya slot akun yang di-suspend
- e2e: server dev dan server lama yang tertinggal di Windows memakai data `use cache` basi setelah seed ulang. e2e kini memakai build produksi (`next start`, 3 menit untuk 89 tes) dan tidak memakai ulang server yang sudah berjalan

### `fix/desain-konsistensi`
- [x] **B.1** `PageHeader` bersama: pita "bedeng taman" selebar layar dengan tepi bawah bergelombang seperti garis tanah, eyebrow bertunas, pola titik sebagai aksen. Dipakai katalog, kelas, video, tryout, petunjuk, hasil, pembahasan, detail paket, keranjang, checkout, transaksi, dan halaman teks
- [x] `Breadcrumb` tunggal (sebelumnya tiga gaya pemisah), `SearchBar` untuk katalog dan video, `SummaryPanel` untuk panel samping (panel beli, keranjang, checkout, transaksi), `StatusBadge`/`PassStatus` untuk semua label status (hasil, riwayat, transaksi)
- [x] Sampul video memakai bahasa visual sampul paket: bidang warna brand per mata pelajaran, singkatan besar, tunas samar (sebelumnya kotak abu dengan ikon play)
- [x] Penanda langkah checkout di eyebrow: "Langkah 1 dari 3" sampai "Langkah 3 dari 3"
- Bug dari review: judul halaman mengecil karena penggabung kelas `cn()` membuang `text-title`; tabel produk transaksi terpotong di 375 px; catatan nomor demo tampil tanpa nomor

**Pengujian (akhir tahap):** lint, typecheck, build lulus; unit 47/47; e2e 89/89 dua kali berturut-turut (desktop + mobile). Pemeriksa desain `lint.mjs`: 0 FAIL. Kriteria yang tercakup: **T.2**, **T.3**, **T.18** (bagian berlangganan), bersama T.1 dan T.4–T.11 dari tahap sebelumnya.

**Review visual:** screenshot 1440, 1024, 768, 375 px untuk katalog, kelas, video, detail paket, petunjuk tryout, halaman teks, keranjang, checkout, transaksi, dashboard transaksi, dan invoice; tidak ada error console dan tidak ada scroll horizontal.

**Catatan:**
- Mode Midtrans belum diuji ke sandbox asli karena kunci belum diisi; isi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `PAYMENT_MODE=midtrans`, lalu daftarkan URL notifikasi `https://<domain>/api/webhooks/midtrans` di dashboard Midtrans
- `/transaksi` (tanpa nomor) tetap dialihkan ke `/dashboard/transaksi` sebagai daftar pesanan

## Tahap 5 — Panel administrator (25 Oktober 2026)

Tiga batch, masing-masing di-squash ke `main` setelah lint, typecheck, unit, build, dan seluruh e2e lulus berulang. Kriteria **T.12** (admin menginput materi dan soal) dan **T.13** (admin mengelola pengguna, produk, kelas, soal, tryout, transaksi) kini tercakup e2e.

### `feat/M-admin-dasar-soal-tryout` (batch A)
- [x] **M.1** Layout `/admin` dengan sidebar berkelompok (Ringkasan, Pengguna dan penjualan, Konten belajar, Sistem); di layar kecil menjadi lembar menu. Menu ditambahkan bersama halamannya, jadi tidak ada tautan mati. Penanda jumlah untuk transaksi menunggu dan essay belum dinilai
- [x] **M.2.1–M.2.8** Dashboard admin: total dan siswa baru, transaksi dan pendapatan, program terlaris, tryout terpopuler, tingkat penyelesaian kelas, aktivitas terbaru, grafik pendapatan bulanan dan pengguna baru (WIB, enam bulan, tabel data bisa dibuka)
- [x] **M.3, C.2.1** Pengguna: cari dan filter, tambah (siswa/admin), ubah nama/email/role, nonaktifkan/aktifkan (akun nonaktif langsung tertolak), kirim tautan reset password dan buka kunci login, riwayat program, progres kelas, tryout, dan transaksi. Admin tidak bisa menurunkan role atau menonaktifkan akunnya sendiri
- [x] **C.2.6** Transaksi: cari dan filter status, detail pembayaran, verifikasi manual (mengaktifkan paket lewat `activateOrder` yang sama dengan webhook), batalkan (kuota voucher kembali), tandai dana dikembalikan (akses dari pesanan dibatalkan, hitungan terjual dikurangi), riwayat tindakan admin
- [x] **C.2.7** Voucher: buat/ubah (persen dengan potongan maksimal, nominal, minimum belanja, kuota, batas per pengguna, masa berlaku WIB), aktif/nonaktif, hapus bila belum pernah dipakai, daftar pemakaian
- [x] **M.5.1–M.5.8, L.2.5** Bank soal: enam jenis soal dengan aturan kunci per jenis, opsi bergradasi (TKP), gambar soal (upload Cloudinary bertanda tangan), pembahasan dan video pembahasan; impor CSV/XLSX dua langkah (periksa lalu impor, nomor baris bermasalah ditunjukkan), ekspor CSV/XLSX dengan kolom yang sama (bisa diimpor ulang) dan template; pratinjau, duplikasi, cari dan filter, hapus dan terbit massal. Soal yang dipakai tryout tidak bisa dihapus; ID opsi dipertahankan saat diubah agar jawaban lama tetap utuh
- [x] **M.6.1–M.6.9, C.2.4** Tryout: pengaturan lengkap (jadwal, percobaan, acak soal/opsi, pembahasan dan waktu bukanya, skor benar/salah, passing grade, status), subtes dengan durasi dan bobot sendiri, pilih soal dari bank soal, urutan seret-dan-lepas (juga dengan keyboard), bobot khusus per soal, pratinjau dengan kunci dan skor maksimum, duplikat, hapus. Struktur terkunci begitu ada percobaan
- [x] **C.2.5, L.2.9** Hasil peserta per tryout (nilai per subtes, B/S/K, waktu, kelulusan) dan unduh nilai CSV
- [x] **L.2.7** Penilaian essay: antrean jawaban, batas nilai sesuai bobot, nilai akhir/subtes/kelulusan/analisis topik dihitung ulang (`rescoreAttempt`), notifikasi ke siswa
- [x] **P.1.10** Audit log semua tindakan admin (siapa, apa, kapan, IP, sebelum/sesudah) dengan filter
- [x] Upload Cloudinary: `/api/upload/signature` memeriksa tipe dan ukuran (gambar 5 MB, PDF 20 MB) sebelum membuat signature; hasil upload diverifikasi signature-nya sebelum dicatat di `Media`
- [x] Tes unit: statistik bulanan WIB, input tanggal WIB, CSV (urai, ekspor-impor bolak-balik, validasi per jenis), aturan upload; e2e `admin.spec.ts` (10 alur, desktop + mobile)

**Bug yang ditemukan dan diperbaiki:**
- Form admin mengirim nilai hasil transformasi Zod (Date, angka) ke server yang memvalidasi ulang string mentah; kini yang dikirim nilai mentah form
- Pengembalian dana tidak mengurangi hitungan terjual sehingga program terlaris membengkak
- Tes video kadang membaca salinan konten yang masih di-stream (div tersembunyi); tes kini menunggu jaringan tenang

**Pengujian:** lint, typecheck, build lulus; unit 64/64; e2e 109/109 dua kali berturut-turut (desktop + mobile). Pemeriksa desain: 0 FAIL (panel admin diperiksa dengan mode `--app` karena layar padat fungsional). Review visual 1440 dan 375 px untuk semua halaman admin: tanpa error console dan scroll horizontal.

### `feat/L-kelas-produk-konten` (batch B1)
- [x] **M.1 Program** Kategori ujian: tambah, ubah (nama, singkatan, slug, sasaran, urutan), hapus bila belum dipakai
- [x] **L.1, L.2.1, C.2.2** Kelas: pengaturan (program, mata pelajaran, tingkat, ringkasan, deskripsi, status), kunci materi berurutan, aktif/nonaktif sertifikat (tidak bisa dimatikan setelah ada sertifikat terbit), hapus (soft delete)
- [x] **L.2.2** Bab dan materi diurutkan dengan seret-dan-lepas (juga keyboard: Spasi lalu panah); pindah materi antarbab dari halaman materi; bab kosong bisa dihapus
- [x] **L.2.10, G.4.10** Bab baru 1 dan 2 otomatis gratis; tanda gratis bisa diubah per bab
- [x] **L.2.3–L.2.5** Materi video (dari pustaka), PDF, bacaan, kuis, tugas; isi HTML tersanitasi; lampiran PDF diunggah ke Cloudinary sebagai file berbayar (authenticated); kuis: nilai lulus dan soal dari bank soal (tanpa essay), urutan seret-dan-lepas
- [x] **L.2.4** Video pustaka: URL YouTube/Vimeo/berkas MP4-WebM dengan deteksi penyedia, durasi menit:detik, transkrip; durasi materi yang memakai video ikut diperbarui; hapus hanya bila tidak dipakai materi
- [x] **L.2.6, C.2.5** Tab Peserta kelas: progres materi, waktu tonton, akses paket, aktivitas terakhir
- [x] **M.4, C.2.3** Paket produk: nama, slug, program, jenis, jenjang, ringkasan, deskripsi, thumbnail, harga dan harga promo, masa aktif, fitur, FAQ, status, serta kelas, tryout, dan video yang termasuk; hapus (soft delete, akses pembeli tetap berlaku)
- [x] **M.6.1** Gambar tryout tampil di halaman petunjuk; thumbnail paket tampil di kartu dan detail paket (`next/image` dari Cloudinary)
- [x] Tes unit deteksi penyedia video dan durasi; e2e `admin-konten.spec.ts` (program, video, kelas dan kurikulum, paket) dijalankan setelah proyek lain agar paket uji tidak memengaruhi hitungan katalog

**Bug yang ditemukan dan diperbaiki:**
- Halaman paket publik menampilkan kelas dan tryout yang masih draf atau sudah dihapus; kini hanya yang terbit yang ditampilkan dan dihitung
- Slug otomatis dari judul tergabung dengan teks yang diketik bila pengguna langsung pindah ke kolom slug ("paket-a" menjadi "paket-apaket-a")
- ID aksesibilitas dnd-kit berbeda antara server dan client (hydration mismatch)
- Teks `sr-only` di kolom terakhir tabel lolos dari wadah geser dan membuat halaman meluber di 375 px
- Thumbnail kelas dan video tidak pernah ditampilkan publik, jadi kolom unggahnya dihapus dari form (tidak ada kontrol tanpa efek)
- Tes: regex ID `[a-z0-9]+` juga cocok dengan `/baru` sehingga beberapa tes lanjut sebelum data tersimpan; kini memakai panjang cuid

**Pengujian:** lint, typecheck, build lulus; unit 66/66; e2e 117/117 dua kali berturut-turut. Pemeriksa desain 0 FAIL. Review visual 1440 dan 375 px untuk semua halaman batch ini.

### `feat/C2-konten-situs-laporan` (batch B2)
- [x] **L.2.8** Diskusi: daftar pertanyaan siswa dengan filter belum/sudah dijawab, balasan admin bertanda khusus, notifikasi ke penanya dengan tautan ke materi, hapus diskusi atau balasan (moderasi); penanda jumlah belum dijawab di menu
- [x] **C.2.8, D.4.1–D.4.2** Informasi: admin menulis artikel (kategori, ringkasan, sampul, isi HTML tersanitasi, status; tanggal terbit otomatis). Halaman publik `/informasi` (filter kategori, tulisan terbaru besar + daftar ringkas) dan `/informasi/[slug]` (penulis, tanggal, kategori, sampul, isi, artikel terkait), JSON-LD Article (**Q.2.6**), slug tak dikenal 404 asli
- [x] **C.2.8** Banner: gambar wajib, tautan internal/https, urutan, aktif, jadwal tayang; tampil di beranda di bawah menu cepat (maksimal tiga, tidak tampil bila kosong)
- [x] **M.1 Testimoni** Tambah, ubah, sembunyikan, hapus, urutan; langsung dipakai beranda
- [x] **M.1 Sertifikat** Sertifikat per kelas, judul yang tercetak bisa diubah, daftar penerima dengan nomor yang bisa diverifikasi
- [x] **M.2, L.2.9 Laporan** Rentang tanggal WIB: pendapatan, pesanan per status, penjualan per paket, siswa baru, tryout selesai; unduh CSV transaksi, pengguna, nilai per tryout, progres per kelas
- [x] **M.1 Pengaturan** FAQ beranda (tambah, ubah urutan, hapus) dan kontak layanan yang dipakai halaman Hubungi kami
- [x] Gaya isi artikel dan materi bacaan (`rich-text`): judul bagian, kutipan, tautan, jarak antarblok
- [x] Menu admin lengkap 16 butir M.1 ditambah Penilaian, Diskusi, dan Audit log; tautan entitas di audit log
- [x] Tes unit rentang laporan WIB; e2e diskusi, artikel publik, testimoni, validasi banner, pengaturan kontak, laporan CSV

**Bug yang ditemukan dan diperbaiki:**
- Fungsi rentang laporan berada satu berkas dengan query Prisma sehingga tes unitnya gagal dimuat tanpa database; dipisah menjadi fungsi murni (`report-range.ts`)
- Daftar dalam isi artikel dan bacaan tidak punya gaya judul bagian, tautan, dan kutipan

**Pengujian:** lint, typecheck, build lulus; unit 68/68; e2e 126/126 (8 tes khusus satu perangkat sengaja dilewati di perangkat lain) dua kali berturut-turut. Pemeriksa desain 0 FAIL. Review visual 1440 dan 375 px untuk halaman admin batch ini serta `/informasi`, detail artikel, dan `/kontak`.

**Catatan Tahap 5:**
- Upload banner, sampul, thumbnail paket, gambar soal, dan PDF memakai Cloudinary sungguhan; e2e hanya menguji validasinya agar tes tidak bergantung pada jaringan
- Penilaian tugas (L.2.7 "tugas") belum punya model pengumpulan; materi Tugas berisi instruksi, sedangkan essay dinilai di menu Penilaian
- Sitemap dan robots (Q.2.3–Q.2.4) dikerjakan di Tahap 6

### `fix/revisi-admin-ui-sesi` (revisi RMED setelah Tahap 5)
- [x] **C.2, C.3** Admin hanya memakai panel admin: `/dashboard`, `/keranjang`, `/checkout`, dan `/transaksi` dialihkan ke `/admin` (detail transaksi ke `/admin/transaksi/[nomor]`); menu akun, menu mobile, dan bottom nav admin hanya berisi panel admin
- [x] **C.2** Admin tidak bisa membeli: tombol beli diganti tautan "Kelola paket", dan server action keranjang serta checkout menolak akun admin
- [x] **P.2.6** Konfirmasi memakai SweetAlert2 bertema brand (`lib/alert.ts`, gaya `.tp-swal` di `globals.css`): keluar akun dan semua `ConfirmDialog` (hapus, nonaktifkan, verifikasi, batalkan pesanan)
- [x] **D.1.6** Statistik beranda: grid 2×2, angka rata kiri di atas keterangan dengan garis buku besar
- [x] **B.1, B.2.1** Logo: wordmark satu baris ("TAMAN" tebal, "PELAJAR" lebih ringan) dengan keterangan "Bimbingan belajar"; halaman masuk dan daftar memakai tombol Kembali, logo tidak lagi menjadi tautan

**Bug yang ditemukan dan diperbaiki:**
- Pengguna yang baru masuk tetap melihat dialog "Masuk dulu" saat membeli sampai halaman dimuat ulang. Penyebab: masuk lewat server action lalu navigasi client, sehingga `SessionProvider` tidak tahu sesi berubah. Sesi kini dimuat ulang setiap pindah halaman dan dicek ulang sebelum dialog tampil
- Dialog "Masuk dulu" tetap terbuka di atas form masuk setelah tautan Masuk/Daftar diklik (provider ada di root layout); kini ditutup saat tautan dipilih
- Popup yang dibuka dari menu dropdown mengembalikan `aria-hidden` milik Radix ke header sehingga header hilang dari pembaca layar; popup kini menunggu menu tertutup

**Pengujian:** lint, typecheck, build lulus; unit 68/68; e2e 130/130 (4 tes baru: konfirmasi keluar, beli setelah masuk tanpa muat ulang, admin dialihkan dan tidak bisa membeli). Pemeriksa desain 0 FAIL. Review visual 1440 dan 375 px: navbar, statistik beranda, halaman masuk, popup keluar.

### `fix/logout-tanpa-loader`
- [x] **P.2.6** Popup keluar langsung tertutup setelah "Ya, keluar" ditekan, tanpa loader

### `feat/C1-9-sertifikat-batch` (revisi RMED: sertifikat, batch, tugas praktik)
- [x] **C.1.9, G.4.6** Sertifikat tidak lagi terbit otomatis. Syaratnya: semua materi selesai, rata-rata nilai terbaik setiap kuis kelas ≥ nilai minimal (diatur admin, bawaan 80), dan tugas praktik disetujui admin
- [x] Batch per kelas (`CourseBatch`): siswa berlangganan otomatis masuk batch yang berjalan. Tugas praktik dikirim paling lambat tanggal selesai batch; yang belum disetujui saat batch berakhir dinyatakan belum lulus
- [x] Ulang gratis: siswa yang gagal mendapat akses kelas itu gratis selama batch berikutnya (walau masa aktif paket habis); progres dan nilai kuis dimulai dari awal
- [x] Tugas praktik: siswa mengunduh template (PDF/DOCX/ZIP, delivery authenticated, hanya peserta) dan mengirim link Google Drive/Docs dari dashboard Sertifikat; ringkasan status di sidebar ruang belajar
- [x] **C.2.5, L.2.7** Menu admin Tugas Praktik (penanda jumlah menunggu): setujui (sertifikat terbit), minta revisi sekali sebelum batas batch, atau tolak; catatan wajib untuk revisi dan tolak. Siswa diberi tahu lewat notifikasi dan email (mode log), semua keputusan tercatat di audit log
- [x] Admin: tab Batch di detail kelas (tambah, ubah, hapus batch tanpa peserta; tanggal tidak boleh tumpang tindih), pengaturan sertifikat (judul, nilai minimal, instruksi, template)
- [x] Kelas tanpa batch: bagian sertifikat tidak ditampilkan ke siswa
- [x] Seed: dua batch per kelas (berjalan dan berikutnya), contoh kiriman yang disetujui dan yang menunggu penilaian
- [x] Tes unit aturan batch, syarat nilai, revisi, dan link Drive; e2e kirim tugas → revisi → setujui → sertifikat terbit, serta kelola batch dan pengaturan sertifikat

**Catatan:** Playwright kini memaksa `PAYMENT_MODE=simulasi` untuk server tes, jadi e2e checkout tetap lulus walau `.env` memakai Midtrans.

**Pengujian:** lint, typecheck, build lulus; unit 78/78; e2e 133/133 (9 tes khusus satu perangkat sengaja dilewati). Pemeriksa desain 0 FAIL. Review visual 1440 dan 375 px: dashboard sertifikat, sidebar ruang belajar, admin Tugas Praktik, Sertifikat, dan tab Batch; tanpa error console.

### `fix/sesi-basi-redirect-loop`
- [x] **P.1.1, P.1.7** Cookie sesi yang basi (akun dihapus, dinonaktifkan, atau database di-seed ulang) membuat loop /masuk ⇄ /dashboard sehingga form masuk tidak bisa dipakai di browser itu. Kini halaman terlindungi mengalihkan ke `/api/sesi/reset`, yang menghapus cookie sesi lalu membuka halaman masuk dengan pesan "Sesimu sudah tidak berlaku"
- [x] e2e: sesi yang masuk sebelum akun dinonaktifkan diarahkan ke halaman masuk tanpa loop

**Pengujian:** lint, typecheck, build lulus; unit 78/78; e2e 133/133.

## Tahap 6 — Pengujian dan penyempurnaan (25 Oktober 2026)

### `feat/Q2-seo-sitemap-readme` (batch A)
- [x] **Q.2.3** `sitemap.xml`: halaman publik statis dan semua paket, kelas, video, tryout, serta artikel yang terbit
- [x] **Q.2.4** `robots.txt`: menutup panel admin, dashboard, ujian, keranjang, checkout, transaksi, invoice, API, dan style guide
- [x] **Q.2.1–Q.2.2** Audit metadata: semua halaman punya judul dan deskripsi; Open Graph detail paket dan artikel kini memuat gambar (thumbnail/sampul, cadangan logo) dan locale `id_ID`
- [x] **R.17–R.18** README: sertifikat dan tugas praktik, email mode log, login Google, URL produksi untuk SEO, masalah umum
- [x] e2e robots, sitemap, dan metadata/OG halaman publik utama

**Pengujian:** lint, typecheck, build lulus; unit 78/78; e2e 139/139 (15 tes khusus satu perangkat sengaja dilewati).

### `feat/Q1-aksesibilitas` (batch B)
- [x] **Q.1.1** Pemindaian axe-core (WCAG 2.1 A/AA + best practice) ke 60+ halaman tamu, siswa, dan admin; semua temuan diperbaiki:
  - **Q.1.4** Kontras: teks putih di latar hijau minimal 90% opasitas; token `success` #166534 dan `warning` #92400e; teks tab tidak aktif dan latar daftar tab
  - **Q.1.6** Nama aksesibel memuat teks yang terlihat: tautan logo, tombol menu akun (nama dari teks, inisial avatar hanya visual)
  - **Q.1.2** Grafik Recharts tidak lagi menerima fokus di dalam area `aria-hidden` (data tetap di tabel); 25 kotak tabel yang bisa digeser kini bisa difokus keyboard dan diberi label; form pencarian punya label unik
  - **Q.1.2** Tautan "Lewati ke konten" juga di dashboard siswa dan panel admin
- [x] e2e aksesibilitas (axe): 10 halaman publik di desktop dan mobile, 5 halaman siswa, 6 halaman admin

**Pengujian:** lint, typecheck, build lulus; unit 78/78; e2e 161/161 (17 tes khusus satu perangkat sengaja dilewati). Pemeriksa desain 0 FAIL.

### `fix/B4-responsif-tautan` (batch C)
- [x] **B.4, T.14** Audit otomatis 65 halaman (tamu, siswa, admin, termasuk halaman detail) di 1440, 1024, 768, dan 375 px: tanpa scroll horizontal. Perbaikan: kotak tabel diberi `relative` (sel `sr-only` tidak keluar kotak), grid responsif diberi kolom `minmax(0,1fr)` di layar kecil (`/admin/laporan` melebar 498 px), menu navbar tamu satu baris di 1024 px
- [x] **T.15** Tanpa error console. Perbaikan: hydration mismatch React #418 di navigasi bawah dan tombol beli (status sesi hanya ada di client) dengan hook `useHydrated`
- [x] **T.16** 265 tautan internal dari semua halaman yang diaudit dicek: tidak ada yang 404 atau error
- [x] Tab aktif memakai border, bukan shadow (aturan desain)

**Catatan:** MySQL XAMPP sempat mati di tengah audit sehingga server dan build gagal; setelah dinyalakan ulang semua tes diulang dari awal.

**Pengujian:** lint, typecheck, build lulus; unit 78/78; e2e 161/161 (17 tes khusus satu perangkat sengaja dilewati). Audit responsif, console, dan tautan bersih.

### `perf/P-performa` (batch D)
- [x] Pengukuran Web Vitals di build produksi (desktop dan mobile dengan CPU 4× lebih lambat) untuk 13 halaman tamu, siswa, dan admin: LCP semua halaman < 1,5 detik, CLS ≈ 0
- [x] SweetAlert2 dimuat saat dibutuhkan (dimuat lebih dulu saat tombol pemicu disorot/difokus): JS awal setiap halaman turun ±75 KB
- [x] Recharts dimuat terpisah lewat `components/charts/lazy.tsx` dengan tinggi yang dipesan: LCP dashboard desktop 448 → 264 ms, dashboard admin 352 → 216 ms
- [x] CLS halaman materi di mobile 0,466 → 0: skeleton memuat kini setinggi layar sehingga footer tidak terdorong
- [x] e2e lebih stabil: `reset-db` mengembalikan materi uji kelas ke keadaan seed

**Pengujian:** lint, typecheck, build lulus; unit 78/78; e2e 161/161 (17 tes khusus satu perangkat sengaja dilewati). Pemeriksa desain 0 FAIL.

### Kriteria keberhasilan (T.1–T.19)

| Butir | Status | Bukti utama |
|---|---|---|
| T.1 Daftar dan masuk | Selesai | `e2e/autentikasi.spec.ts` |
| T.2 Melihat dan membeli paket | Selesai | `e2e/katalog.spec.ts`, `e2e/detail-paket.spec.ts`, `e2e/checkout.spec.ts` |
| T.3 Paket muncul di dashboard | Selesai | `e2e/checkout.spec.ts`, `e2e/dashboard.spec.ts` |
| T.4 Membuka kelas dan menonton video | Selesai | `e2e/kelas.spec.ts`, `e2e/video.spec.ts` |
| T.5 Progres tersimpan | Selesai | `e2e/kelas.spec.ts` |
| T.6–T.11 Tryout: mulai, timer dan autosave, pindah soal, kumpulkan, skor, hasil dan pembahasan | Selesai | `e2e/tryout.spec.ts`, tes unit penilaian |
| T.12 Admin menginput materi dan soal | Selesai | `e2e/admin.spec.ts`, `e2e/admin-konten.spec.ts` |
| T.13 Admin mengelola pengguna, produk, kelas, soal, tryout, transaksi | Selesai | `e2e/admin.spec.ts`, `e2e/admin-konten.spec.ts` |
| T.14 Desktop dan mobile | Selesai | Semua e2e di dua perangkat; audit 65 halaman × 4 lebar |
| T.15 Tanpa error console | Selesai | Audit console 65 halaman × 4 lebar |
| T.16 Tanpa tautan/tombol mati | Selesai | Crawl 265 tautan internal |
| T.17 Tamu membuka halaman publik; popup masuk | Selesai | `e2e/beranda.spec.ts`, `e2e/layout.spec.ts`, `e2e/kelas.spec.ts` |
| T.18 Bab 1–2 gratis, bab lanjutan setelah berlangganan | Selesai | `e2e/kelas.spec.ts`, `e2e/checkout.spec.ts` |
| T.19 Arsitektur, database, sitemap, komponen lebih dulu | Selesai | `docs/ARSITEKTUR.md` |

**Catatan akhir:**
- Pembayaran Midtrans sungguhan dan upload file ke Cloudinary memakai akun luar; e2e memakai mode simulasi dan hanya menguji validasi upload
- Email masih mode log (`MAIL_MODE="log"`); pengiriman sungguhan belum disambungkan
- Angka TTFB diukur di server lokal; di hosting akan bergantung pada lokasi database terkelola

## Revisi RMED setelah Tahap 6 (28 Oktober 2026)

### `fix/revisi-login-program-loading` (batch 1)
- [x] **E.1.2** Setelah masuk, halaman tujuan (mis. panel admin) dimuat dengan navigasi penuh sehingga header, sesi di client, dan cache router lama tidak tertinggal (sebelumnya kadang perlu refresh)
- [x] **D.1.3, D.2.2** Program tanpa paket terbit tidak tampil di beranda dan filter katalog; jumlah program di beranda dihitung otomatis
- [x] **C.2.8** Form banner: panduan ukuran 1200 × 400 px (rasio 3:1) dengan bingkai contoh dan pratinjau seperti di beranda
- [x] **P.2.2** Animasi loading: bar hijau tipis dengan tunas di ujungnya saat pindah halaman, dan loader tunas tumbuh di skeleton dashboard/admin (diam bila `prefers-reduced-motion`)
- [x] e2e lebih stabil: `reset-db` memulihkan pesanan menunggu pembayaran dan notifikasi belum dibaca milik akun demo

**Pengujian:** lint, typecheck, build lulus; unit 78/78; e2e 161/161.

### `feat/M5-mapel-slug-durasi` (batch 2)
- [x] **M.5.1, L.2.1, L.2.4** Menu admin Mata Pelajaran: tambah, ubah urutan, ganti nama (ikut memperbarui kelas, video, dan soal yang memakainya), hapus bila tidak dipakai. Form kelas, video, dan bank soal memilih dari daftar ini; server menolak mata pelajaran yang belum terdaftar, termasuk saat impor CSV/XLSX. Migration mengisi daftar dari data lama
- [x] Slug otomatis mengikuti judul/nama saat membuat program, kelas, video, paket, tryout, dan artikel; berhenti mengikuti bila admin mengubah slug sendiri; form ubah tidak mengubah slug yang sudah terbit
- [x] Durasi video otomatis dari URL: YouTube (IFrame Player API), Vimeo (oEmbed), berkas MP4/WebM (metadata). Tetap bisa diubah manual; durasi materi video mengikuti video. Durasi tryout tetap diisi manual
- [x] Tes unit impor soal dengan mata pelajaran; e2e kelola mata pelajaran, slug otomatis video

**Pengujian:** lint, typecheck, build lulus; unit 79/79; e2e 163/163. Durasi otomatis dicek manual di browser: YouTube 10:35 terbaca, Vimeo publik terbaca lewat oEmbed.

### `feat/M1-hapus-massal` (batch 3)
- [x] **M.1, C.2.3–C.2.4** Hapus massal di menu Program, Kelas, Video, Paket Produk, dan Tryout: kotak centang per baris, pilih semua, bilah aksi dengan konfirmasi. Aturannya sama dengan hapus satuan; yang tidak boleh dihapus (program masih berisi, video dipakai materi, tryout sedang dikerjakan) dilewati dan alasannya ditampilkan. Setiap penghapusan tercatat di audit log
- [x] e2e hapus massal program, termasuk program yang dilewati

**Pengujian:** lint, typecheck, build lulus; unit 79/79; e2e 165/165.

### `feat/G-tambah-kelas-testimoni` (batch 4)
- [x] **F.1, G** Tombol "Tambah kelas" di daftar dan detail kelas: kelas masuk ke Kelas Saya (bab 1–2 tetap gratis, bab lanjutan tetap butuh paket); tombol berubah menjadi "Sudah di Kelas Saya" dan bisa mengeluarkan lagi; kelas dari paket bertanda "Terdaftar lewat paket". Tamu diminta masuk dulu
- [x] **D.1.7** Testimoni siswa: popup sekali saat satu kelas selesai 100% ("Nanti saja" disimpan di browser) dan tombol "Tulis testimoni" di Kelas Saya. Testimoni masuk sebagai "Menunggu tinjauan" dan baru tampil di beranda setelah admin menekan Terbitkan (masuk urutan paling akhir); penanda jumlah di menu Testimoni
- [x] e2e: tamu diminta masuk, tambah/keluarkan kelas, tanda kelas dari paket, popup testimoni sampai diterbitkan admin; tes kelas dan carousel beranda dibuat tidak bergantung pada testimoni/progres dari tes lain

**Pengujian:** lint, typecheck, build lulus; unit 79/79; e2e 173/173 (17 tes khusus satu perangkat sengaja dilewati). Pemeriksa desain 0 FAIL. Review visual 1440 dan 375 px halaman baru tanpa scroll horizontal dan error console.

