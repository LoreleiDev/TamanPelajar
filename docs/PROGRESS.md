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

## Tahap 1 — Design system, layout, beranda, katalog, detail paket

Belum dimulai (menunggu persetujuan).

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
