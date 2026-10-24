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

## Tahap 2 — Autentikasi, database, dashboard, kelas, video

Belum dimulai.

## Tahap 3 — Tryout CBT

Belum dimulai.

## Tahap 4 — Keranjang, checkout, pembayaran

Belum dimulai.

## Tahap 5 — Panel administrator

Belum dimulai.

## Tahap 6 — Pengujian dan penyempurnaan

Belum dimulai.
