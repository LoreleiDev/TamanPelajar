# CLAUDE.md — Taman Pelajar

Panduan untuk Claude Code saat membangun proyek ini. Baca file ini sebelum mulai bekerja.

## Ringkasan proyek

Taman Pelajar adalah aplikasi bimbingan belajar online full-stack: kelas online, video pembelajaran, penjualan paket belajar, tryout CBT (fitur utama), hasil dan pembahasan ujian, dashboard pengguna, dan panel administrator. Aplikasi harus berfungsi penuh end-to-end, bukan desain statis.

- Nama brand: **Taman Pelajar**. Logo sudah ada; lihat bagian Desain. Ilustrasi, teks, dan soal harus orisinal. Jangan menyalin aset, teks, atau soal dari website mana pun; yang ditiru hanya konsep fungsi dan alur pengguna.
- Seluruh teks antarmuka (label, tombol, pesan error, toast, email, metadata) **wajib Bahasa Indonesia**. Kode, nama variabel, nama model, dan komentar teknis boleh Bahasa Inggris.
- **Dua role saja**: `ADMIN` dan `USER`.
  - `ADMIN`: menginput dan mengelola semua konten (materi, video, kelas, bank soal, tryout, produk/paket) serta mengelola pengguna, transaksi, voucher, banner, dan laporan.
  - `USER`: pengguna biasa yang mengakses dan membeli materi/soal, mengikuti kelas, menonton video, mengerjakan tryout, melihat hasil dan pembahasan.

## Dokumen rujukan

- Spesifikasi lengkap ada di **Lampiran: Rincian Fitur Lengkap** di akhir file. Butir bernomor (mis. **I.3.2**) adalah sumber kebenaran cakupan fitur; baca yang relevan sebelum mengerjakan fitur dan rujuk nomornya di commit dan catatan progres.
- Jika panduan di atas lampiran lebih spesifik (aturan tryout, Cloudinary, desain), ikuti panduan itu.
- `docs/PROGRESS.md`: catatan progres; centang nomor butir yang selesai.
- Jangan menambah fitur di luar daftar tanpa diminta. Jika ada yang ambigu, usulkan opsi paling sederhana yang memenuhi butir dan tanyakan ke RMED sebelum mengerjakannya.

## Alur kerja dan Git (wajib)

- **Minta persetujuan RMED sebelum bertindak.** Sebelum membuat, mengubah, atau menghapus file, memasang paket, menjalankan migration, commit, push, atau merge, jelaskan rencananya secara singkat lalu tunggu jawaban "ya". Membaca file dan menjalankan tes tidak perlu izin. Beberapa perubahan kecil yang saling terkait boleh diajukan sekaligus.
- **Satu branch per fitur**, dibuat dari `main` terbaru: `feat/<nomor-butir>-<nama-singkat>` (mis. `feat/I3-timer-ujian`), atau `fix/<nama>` untuk perbaikan. Jangan bekerja langsung di `main`.
- **Tes dulu sebelum push.** `pnpm lint`, `pnpm typecheck`, `pnpm test`, dan `pnpm build` harus lulus; tambah `pnpm test:e2e` bila fitur menyentuh alur di butir T. Jika gagal, perbaiki dulu. Tes tidak boleh dilewati atau dimatikan.
- **Push ke branch fitur otomatis**: setelah RMED menyetujui commit dan semua tes lulus, langsung `git push -u origin <branch>`. Pesan commit berbahasa Indonesia dan menyebut nomor butir.
- **Merge ke `main` hanya setelah RMED setuju.** Buka Pull Request (`gh pr create`) berisi ringkasan, nomor butir, hasil tes, dan screenshot bila ada perubahan tampilan. Tunggu persetujuan RMED, lalu merge (squash), hapus branch, dan perbarui `main` lokal.
- Jangan pernah force push ke `main` atau meng-commit `.env`.

## Tech stack (sudah diputuskan)

| Area | Pilihan |
|---|---|
| Framework | Next.js versi stabil terbaru, App Router, TypeScript strict |
| UI | Tailwind CSS, shadcn/ui, Lucide Icons |
| Form & validasi | React Hook Form + Zod (skema Zod dipakai bersama di client dan server) |
| Grafik | Recharts |
| Tabel admin | TanStack Table |
| ORM | Prisma |
| Database | **MySQL 8**, `datasource provider = "mysql"`. Produksi: MySQL terkelola (PlanetScale, Aiven for MySQL, atau TiDB Cloud). Lokal: MySQL 8 terpasang langsung di laptop (Laragon atau MySQL Installer), **tanpa Docker** |
| Auth | Auth.js (NextAuth v5): Credentials + Google OAuth, session JWT di HTTP-only secure cookie, bcrypt untuk hash password |
| Penyimpanan file | **Cloudinary** untuk semua file: thumbnail, gambar, gambar soal, PDF materi, sertifikat. Tidak memakai Supabase |
| Video | URL YouTube unlisted / Vimeo / URL eksternal (tidak di-upload ke server) |
| Pembayaran | Struktur integrasi Midtrans (Snap + webhook) dan mode simulasi untuk demo |
| Deployment | Vercel |
| Package manager | pnpm |

## Perintah

```bash
pnpm install
# MySQL 8 lokal harus sudah berjalan (Laragon/MySQL Installer); proyek ini tidak memakai Docker
pnpm prisma migrate dev       # buat/terapkan migration
pnpm prisma db seed           # isi data demo
pnpm dev                      # http://localhost:3000
pnpm lint
pnpm typecheck                # tsc --noEmit
pnpm test                     # Vitest (unit: penilaian, voucher, akses)
pnpm test:e2e                 # Playwright (alur kriteria keberhasilan)
pnpm build
```

Jika sebuah script belum ada di `package.json`, tambahkan. Sebelum menyatakan sebuah tahap selesai, jalankan `pnpm lint`, `pnpm typecheck`, `pnpm test`, dan `pnpm build` sampai lulus.

## Struktur folder

```
prisma/
  schema.prisma
  migrations/
  seed.ts
src/
  app/
    (public)/  # beranda, katalog, detail paket, informasi
    style-guide/  # acuan komponen (hanya development)
    (auth)/  # masuk, daftar, lupa/reset password, verifikasi email, lengkapi profil
    (user)/dashboard/  # dashboard user
    kelas/[slug]/  # ruang belajar kelas
    video/  # pustaka & halaman video
    tryout/  # daftar, petunjuk, hasil, pembahasan
    ujian/[attemptId]/  # halaman pengerjaan CBT (layout khusus, tanpa navbar utama)
    keranjang/ checkout/ transaksi/ invoice/
    admin/  # panel administrator (termasuk input materi, kelas, soal, tryout)
    api/  # route handler: auth, webhook Midtrans, upload, export
    not-found.tsx error.tsx sitemap.ts robots.ts
  components/
    ui/  # komponen shadcn (jangan diubah sembarangan)
    layout/  # navbar, footer, sidebar, bottom-nav mobile
    shared/  # card paket, empty state, skeleton, confirm dialog, dll.
    exam/ course/ admin/ charts/
  features/<domain>/  # per domain: actions.ts, queries.ts, schemas.ts, components/
                # domain: auth, catalog, course, video, exam, scoring, cart, payment,
                #         admin, article, notification, certificate
  lib/  # prisma.ts, auth.ts, rbac.ts, cloudinary.ts, midtrans.ts, rate-limit.ts, utils.ts
  types/
middleware.ts  # proteksi route per role
docs/
  ARSITEKTUR.md
  PROGRESS.md
```

## Konvensi kode

- **Mutasi** lewat Server Actions di `features/<domain>/actions.ts`. **Route handler** (`app/api`) hanya untuk webhook, upload, export file, dan endpoint yang dipanggil pihak luar.
- **Pembacaan data** di `features/<domain>/queries.ts`, dipanggil dari Server Components.
- Setiap Server Action: validasi input dengan Zod di server, cek sesi dan role, cek kepemilikan resource (transaksi, enrollment, attempt), lalu kembalikan hasil bertipe `{ ok: true, data } | { ok: false, error: string }` dengan pesan error Bahasa Indonesia.
- RBAC dua lapis: `middleware.ts` untuk route, dan helper `requireRole()` / `requireOwnership()` di `lib/rbac.ts` di setiap action dan query sensitif. Jangan mengandalkan penyembunyian tombol di UI sebagai proteksi.
- Default ke Server Components; pakai `"use client"` hanya untuk interaksi (form, timer, player, chart).
- Uang disimpan sebagai `Int` dalam rupiah (tanpa desimal). Format tampilan dengan `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })`.
- Waktu disimpan UTC; tampilkan dalam zona `Asia/Jakarta` dengan format tanggal Indonesia.
- Slug URL ramah SEO dalam Bahasa Indonesia (mis. `/paket/persiapan-utbk-snbt`).
- Rahasia dan API key hanya dari environment variable. Setiap variabel baru wajib ditambahkan ke `.env.example`.
- Aksi berisiko memakai confirmation dialog; hasil aksi memakai toast.
- Tidak boleh ada tombol atau tautan mati. Jika fitur belum dibangun, buat alur demo yang berjalan.

## Akses tamu dan bab gratis (C.5, G.4.10–G.4.12, K.5)

- Tamu boleh membuka semua halaman publik. `middleware.ts` hanya memproteksi `/dashboard`, `/admin`, `/ujian`, `/keranjang`, `/checkout`, `/transaksi`.
- Interaksi tamu (buka materi, putar video, mulai tryout, tambah ke keranjang, bookmark, diskusi) memunculkan dialog "Masuk dulu" dengan tombol Masuk dan Daftar, lalu kembali ke halaman semula lewat `callbackUrl`. Satu komponen bersama, misalnya `useRequireLogin()`.
- Satu helper server `canAccessLesson(user, lesson)` di `lib/access.ts`: tamu ditolak; bab gratis (`CourseSection.isFree`, bawaan bab 1–2, diatur admin) terbuka untuk user login; bab lain butuh Enrollment aktif dari paket yang mencakup materi itu. Helper ini dipakai di query, signed URL Cloudinary, dan URL video. URL video dan PDF bab terkunci tidak dikirim ke client.
- Bab terkunci tampil dengan ikon gembok; klik membuka dialog ajakan berlangganan ke paket terkait, lalu ke checkout Midtrans. Setelah pembayaran `BERHASIL`, bab lanjutan terbuka selama masa aktif.

## Database (Prisma + MySQL)

- Model minimal mengikuti bagian **N** di Lampiran (User, Profile, Course, Exam, ExamAttempt, Product, Order, Payment, Voucher, AuditLog, dan lainnya).
- Setiap model: `id String @id @default(cuid())`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
- Soft delete (`deletedAt DateTime?`) untuk data penting: User, Course, Product, Exam, Question, Order.
- Status memakai `enum` Prisma (mis. `PaymentStatus { MENUNGGU BERHASIL GAGAL KEDALUWARSA DIKEMBALIKAN }`).
- Role disimpan sebagai enum `Role { ADMIN USER }` di User. Tidak ada role pengajar.
- Catatan khusus MySQL:
  - Kolom teks panjang (isi soal, pembahasan, artikel, deskripsi) pakai `@db.Text` atau `@db.LongText`; `String` biasa jadi `VARCHAR(191)`.
  - Tambahkan `@@index` pada setiap foreign key dan kolom yang sering difilter (status, categoryId, userId, slug).
  - Pakai foreign key constraint. Jika host database tidak mendukungnya, pakai `relationMode = "prisma"` dan pastikan semua relasi punya `@@index`.
  - Gunakan `prisma.$transaction` untuk checkout, aktivasi paket, dan submit ujian.
- Jangan edit migration yang sudah diterapkan; buat migration baru.

## Penyimpanan file (Cloudinary)

- Semua upload lewat route handler server `app/api/upload` yang membuat signature; `CLOUDINARY_API_SECRET` tidak pernah dikirim ke client. Boleh memakai paket `next-cloudinary` untuk widget upload dan komponen gambar.
- Simpan metadata di model `Media` (`publicId`, `resourceType`, `format`, `version`, `bytes`, `deliveryType`, `uploadedById`), bukan URL mentah. Model lain (Product, Course, Lesson, Question, Article, Banner, Certificate) merujuk `mediaId`.
- File publik (thumbnail, banner, cover artikel) memakai delivery `upload`. File berbayar (PDF materi, sertifikat) memakai delivery `authenticated` dan diberikan ke user lewat signed URL yang kedaluwarsa, setelah cek enrollment di server.
- Gambar ditampilkan dengan transformasi otomatis (`f_auto,q_auto`, lebar sesuai kebutuhan).
- Akun gratis Cloudinary memblokir pengiriman PDF/ZIP secara bawaan; aktifkan "Allow delivery of PDF and ZIP files" di Settings > Security. Cantumkan langkah ini di README.
- Validasi tipe dan ukuran file di server sebelum membuat signature (gambar maks. 5 MB, PDF maks. 20 MB).
- Folder Cloudinary per domain: `tamanpelajar/{produk,kelas,soal,artikel,banner,sertifikat}`.

## Aturan sistem tryout (fitur utama, bagian I dan J)

- **Timer otoritatif di server**: simpan `startedAt` dan `deadlineAt` (per attempt dan per subtes) di database. Countdown di client dihitung dari `deadlineAt`, bukan dari state lokal, sehingga tetap benar setelah refresh.
- **Autosave**: setiap perubahan jawaban disimpan ke `ExamAnswer` (debounce sekitar 1 detik) beserta status ragu-ragu. Refresh halaman harus memulihkan jawaban, soal aktif, dan sisa waktu.
- **Kunci jawaban tidak pernah dikirim ke client** selama ujian berlangsung. Pembahasan hanya dikirim setelah attempt selesai dan sesuai pengaturan waktu buka pembahasan.
- **Submit idempoten**: cek status attempt di dalam transaksi agar tidak terjadi pengiriman ganda. Saat waktu habis, ujian dikumpulkan otomatis (client memicu submit; server juga menolak jawaban setelah `deadlineAt` dan menandai attempt kedaluwarsa sebagai selesai saat diakses).
- **Penilaian hanya di server**, di `features/scoring/`, sebagai fungsi murni yang diuji unit: skor benar, skor salah (nol atau negatif), kosong = 0, bobot soal, bobot subtes, passing grade.
- Peringatan sisa waktu 10, 5, dan 1 menit. Acak soal dan opsi per attempt dengan seed yang disimpan agar urutan tetap sama setelah refresh.
- Catat aktivitas ujian (mulai, pindah tab, fullscreen keluar, submit) di `ExamActivityLog`.
- Warna benar/salah di pembahasan (hijau/merah) harus disertai ikon atau teks, bukan warna saja, demi aksesibilitas.

## Pembayaran

- Alur: pilih paket → keranjang → voucher → periksa pesanan → pilih metode → bayar → verifikasi otomatis → aktivasi paket.
- Abstraksi `PaymentProvider` di `lib/` dengan dua implementasi: `midtrans` dan `simulasi`. Pilih lewat env `PAYMENT_MODE=simulasi|midtrans`. Default lokal dan demo: `simulasi`.
- Aktivasi paket (membuat Enrollment dan akses tryout) hanya terjadi dari status `BERHASIL`, di satu tempat, dan idempoten. Webhook Midtrans wajib memverifikasi signature.
- Invoice dapat dicetak / disimpan sebagai PDF (halaman cetak dengan CSS print sudah cukup).

## Desain

- Tema mengikuti logo Taman Pelajar (sama dengan butir B.1 di Lampiran): dominan putih, warna utama hijau tua, aksen dari tunas pada logo.
- Token warna (nilai persis dari butir B.1.2 sampai B.1.4 dan B.1.12):

  | Token | Hex | Pemakaian |
  |---|---|---|
  | `primary` | `#3F7042` | tombol utama, link, heading brand |
  | `primary-foreground` | `#FFFFFF` | teks di atas `primary` |
  | `olive` | `#718A35` | aksen sekunder, ujung gradient hero |
  | `leaf` | `#A0C064` | badge, progres (bukan untuk teks) |
  | `bark` | `#6E531C` | aksen kecil, secukupnya |
  | `muted` / `border` | `#D6D7D6` | latar sekunder, garis |
  | `background` | `#FFFFFF` | latar utama |
  | `foreground` | `#283331` | teks utama |

  Warna hover/pressed boleh diturunkan dari `primary` (lebih gelap sekitar 10%), tanpa menambah warna baru.
- Hero memakai gradient hijau tua ke hijau zaitun (`#3F7042` → `#718A35`).
- Status benar/salah tetap hijau/merah standar, tetapi hijau "benar" harus dibedakan dari `primary` (pakai ikon centang dan teks).
- Logo `public/logo-taman-pelajar.jpeg` (dari `brand/`) dipakai di navbar, footer, halaman auth, favicon/OG, dan invoice. Untuk navbar pakai potongan tunas + tulisan saja. Pakai `next/image` dengan `alt="Taman Pelajar"`.
- Tagline dari logo boleh dipakai di hero/footer: "Pelatihan Berkualitas · Penilaian Cermat · Sertifikat Akurat".
- Radius 12–20 px, shadow lembut. Font Plus Jakarta Sans (`next/font`). Warna sebagai CSS variable / token Tailwind yang konsisten dengan shadcn.

## Desain anti-generik (wajib)

Tampilan harus terasa dirancang khusus untuk Taman Pelajar, bukan template hasil generate AI. Aturan ini mengalahkan kebiasaan default.

**Arah visual: "taman yang tertata"**
- Ambil motif dari logo: tunas, daun, dan lengkung hijau di sudut poster. Pakai sebagai elemen grafis kecil yang konsisten (pembatas section, penanda progres yang "tumbuh", ikon kosong pada empty state), bukan sebagai dekorasi acak.
- Nuansa: tenang dan rapi seperti buku catatan belajar yang bagus, bukan landing page startup yang ramai.
- **Selera desain mengikuti logo** (`public/logo-taman-pelajar.jpeg`): bersih, segar, organik, banyak ruang putih, hijau tua sebagai warna jangkar. Ambil unsurnya, jangan menyalin posternya:
  - Bentuk lengkung organik hijau tua di satu sudut dan gelombang abu-abu muda di sudut seberangnya (SVG), cukup satu pasang per layar, misalnya di hero, CTA, dan halaman masuk.
  - Pola titik kecil hijau dan lingkaran garis tipis sebagai aksen sesekali.
  - Judul hero dan nama brand memakai huruf kapital tebal hijau tua seperti tulisan di logo; teks lain sentence case.
  - Daftar keunggulan memakai ikon centang dalam lingkaran (`CircleCheck`) hijau tua, seperti tagline di logo.
  - Footer mengikuti baris kontak logo: ikon kecil diikuti nama akun.
  - Hijau daun muda dan cokelat batang hanya untuk aksen kecil (tunas, progres, badge), bukan untuk blok besar.
- Tipografi berkarakter: heading tebal dengan kontras ukuran jelas (minimal 3 tingkat), angka nilai memakai `tabular-nums`.

**Dilarang (ciri "AI slop")**
- Gradient ungu/biru, glassmorphism, blob/orb buram di latar, teks gradient berkilau, efek glow.
- Emoji sebagai ikon. Pakai Lucide secara konsisten (satu ukuran dan stroke per konteks).
- "Tiga kartu fitur identik berikon lingkaran" di setiap section. Variasikan: daftar bernomor, grid asimetris, satu besar + dua kecil, tabel.
- Semua elemen rata tengah. Default rata kiri; tengah hanya untuk hero singkat dan empty state.
- `rounded-2xl` + `shadow-xl` di mana-mana. Banyak elemen cukup border tipis `#D6D7D6` tanpa shadow.
- Copy generik ("Buka potensimu", "Revolusi belajar", lorem ipsum). Tulis spesifik, mis. "Tryout SKD 110 soal, 100 menit, dengan pembahasan".
- Angka palsu yang bombastis ("10K+ siswa", rating 4.9 di semua kartu). Statistik beranda diambil dari database (seed) dan boleh kecil.
- Avatar foto acak dan testimoni bernada iklan. Testimoni seed ditulis wajar, avatar berupa inisial.
- Animasi berlebihan (fade-in saat scroll di semua elemen, parallax, efek mengetik). Cukup transisi hover 150–200 ms; hormati `prefers-reduced-motion`.
- Ilustrasi 3D/isometrik generik. Bila belum ada ilustrasi, pakai motif tunas SVG sederhana dan tandai `TODO: ilustrasi`.

**Wajib**
- Halaman `/style-guide` (hanya development) berisi warna, tipografi, tombol, input, kartu paket, badge, tabel, empty state, skeleton. Semua halaman memakai komponen ini; jangan buat varian baru per halaman.
- Kepadatan sesuai konteks: halaman publik lega; dashboard, panel admin, dan ujian padat dan fungsional (tabel rapi, angka sejajar, tanpa kartu dekoratif).
- Halaman ujian fokus: tanpa dekorasi, kontras tinggi, teks soal min. 16–18 px, status nomor soal dibedakan warna **dan** ikon.
- Setiap state dirancang: loading (skeleton sesuai konten), kosong (pesan + aksi berikutnya), error (penjelasan + cara memperbaiki).
- **Review visual setiap halaman selesai**: screenshot Playwright di 1440, 1024, 768, 375 px, cek terhadap daftar "Dilarang", perbaiki, lalu catat di `docs/PROGRESS.md`.

## Keamanan, aksesibilitas, SEO

- Rate limiting dan proteksi brute force untuk login, daftar, lupa password, dan endpoint submit.
- Sanitasi HTML untuk konten kaya (artikel, soal, diskusi) sebelum dirender.
- Audit log untuk setiap tindakan admin.
- WCAG dasar: label di semua form, navigasi keyboard, alt text, kontras cukup, heading hierarkis, `aria-label` pada tombol ikon.
- Metadata dan Open Graph di setiap halaman, `sitemap.ts`, `robots.ts`, schema markup JSON-LD untuk Course dan Article.

## Data demo (seed)

Ikuti bagian **O** di Lampiran; semua teks dan soal dummy harus orisinal. Tandai bab 1–2 setiap materi sebagai gratis.

Akun demo (password sama untuk semua, cantumkan juga di README):

| Role | Email | Password |
|---|---|---|
| Admin | admin@tamanpelajar.test | Demo12345! |
| User | user1@tamanpelajar.test … user5@tamanpelajar.test | Demo12345! |

Seed harus bisa dijalankan ulang (hapus lalu isi, atau upsert).

## Tahap pengerjaan

Kerjakan berurutan. Selesaikan dan verifikasi satu tahap sebelum lanjut, lalu perbarui `docs/PROGRESS.md`.

0. **Persiapan**: tampilkan arsitektur aplikasi, struktur database, sitemap, dan daftar komponen (tulis di `docs/ARSITEKTUR.md`). Inisialisasi proyek, Tailwind, shadcn, Prisma (ke MySQL 8 lokal, tanpa Docker), `.env.example`.
1. Design system + halaman `/style-guide`, layout, navbar, footer, beranda, katalog, detail paket.
2. Autentikasi, skema database + migration + seed, dashboard user, sistem kelas dan video.
3. Sistem tryout: autosave, timer, navigasi soal, penilaian, hasil, pembahasan.
4. Keranjang, checkout, pembayaran demo, aktivasi paket.
5. Panel administrator (input materi/kelas/soal/tryout, kelola pengguna/produk/transaksi), laporan.
6. Pengujian, perbaikan responsivitas, aksesibilitas, dan performa.

## Definisi selesai

Aplikasi selesai jika semua butir **T.1–T.19** di Lampiran berjalan; alur utamanya sebaiknya tercakup tes e2e Playwright.

## Variabel lingkungan (isi `.env.example`)

```
DATABASE_URL="mysql://root:@localhost:3306/tamanpelajar"
AUTH_SECRET=""
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_UPLOAD_FOLDER="tamanpelajar"
PAYMENT_MODE="simulasi"
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Lampiran: Rincian Fitur Lengkap

Spesifikasi lengkap dari brief proyek (sudah memuat keputusan terbaru). Revisi ditulis dengan nomor butir, mis. "I.3.6 tambah jenis soal menjodohkan".

### Aturan Umum (Pembuka)

- **0.1** Peran pembuat: Senior Full-Stack Developer, Software Architect, UI/UX Designer, dan Database Engineer.
- **0.2** Produk: LMS bimbingan belajar online yang terinspirasi struktur dan alur platform bimbel modern (referensi: Privatalfaiz).
- **0.3** Cakupan inti: kelas online, video pembelajaran, penjualan paket, tryout CBT, hasil ujian, pembahasan soal, dashboard siswa, panel administrator.
- **0.4** Larangan menyalin logo, nama, ilustrasi, teks, foto, soal, dan aset website referensi.
- **0.5** Nama: "Taman Pelajar", memakai logo `brand/logo-taman-pelajar.jpeg`.
- **0.6** Identitas visual dan komponen harus orisinal.
- **0.7** Yang ditiru hanya konsep fungsi, susunan informasi, dan alur pengguna.
- **0.8** Seluruh website berbahasa Indonesia.
- **0.9** Website berfungsi penuh, bukan desain statis.

### A. Teknologi

Rincian A.1–A.5 sama dengan tabel **Tech stack** di atas: Next.js App Router, TypeScript, Tailwind, shadcn/ui, Lucide, React Hook Form + Zod, Recharts, TanStack Table (A.1); Server Actions/REST, Prisma + MySQL 8, Auth.js, JWT/secure session, bcrypt (A.2); Cloudinary, video YouTube/Vimeo (A.3); Midtrans + simulasi, status menunggu/berhasil/gagal/kedaluwarsa/dikembalikan (A.4); Vercel + MySQL terkelola (A.5).
- **A.6** Boleh memakai mock data dulu jika backend belum siap, tetapi struktur harus siap disambungkan ke database asli.

### B. Desain dan Identitas Visual

- **B.1 Karakter desain** (B.1.1–B.1.16): modern, ringan, profesional, ramah pelajar. Token warna, radius, shadow, font, logo, tagline, dan ornamen organik ada di bagian **Desain** dan **Desain anti-generik** di atas.
- **B.2 Navbar desktop** (sticky saat digulir)
  - B.2.1 Logo Taman Pelajar di kiri
  - B.2.2 Menu: Beranda, Mulai Belajar, Tryout, Video, Kelas Online, Informasi
  - B.2.3 Pencarian
  - B.2.4 Notifikasi
  - B.2.5 Foto dan nama pengguna
  - B.2.6 Tombol Masuk/Daftar jika belum login
- **B.3 Navigasi mobile**
  - B.3.1 Hamburger menu
  - B.3.2 Bottom navigation: Beranda, Belajar, Tryout, Transaksi, Profil
- **B.4 Responsif** di desktop 1440 px, laptop 1024 px, tablet 768 px, mobile 375 px.

### C. Jenis Pengguna dan Hak Akses

- **C.1 Pengguna (siswa)**
  - C.1.1 Membeli paket
  - C.1.2 Mengikuti kelas
  - C.1.3 Menonton video
  - C.1.4 Mengunduh materi
  - C.1.5 Mengerjakan kuis dan tryout
  - C.1.6 Melihat nilai
  - C.1.7 Melihat pembahasan
  - C.1.8 Melihat progres
  - C.1.9 Mengunduh sertifikat jika tersedia
- **C.2 Administrator**
  - C.2.1 Mengelola seluruh pengguna
  - C.2.2 Menginput seluruh materi: kelas, materi, video, kuis, dan soal
  - C.2.3 Mengelola kelas dan paket
  - C.2.4 Mengelola soal dan tryout
  - C.2.5 Melihat peserta kelas dan hasil belajar siswa
  - C.2.6 Mengelola pembayaran
  - C.2.7 Mengelola promo
  - C.2.8 Mengelola banner dan informasi
  - C.2.9 Melihat laporan dan statistik
- **C.3** Hanya ada dua role: administrator dan pengguna (siswa). Tidak ada role pengajar.
- **C.4** Role-based access control melindungi setiap halaman.
- **C.5 Akses tamu (belum login)**
  - C.5.1 Tamu dapat membuka seluruh halaman publik: beranda, katalog, detail paket, daftar kelas, video, tryout, dan informasi
  - C.5.2 Tamu tidak dapat berinteraksi: membuka materi, menonton video, mengerjakan kuis/tryout, menambah ke keranjang, membeli, bookmark, diskusi
  - C.5.3 Interaksi oleh tamu memunculkan popup "login dahulu" dengan tombol Masuk dan Daftar
  - C.5.4 Setelah login, pengguna dikembalikan ke halaman yang tadi dibuka
  - C.5.5 Server tetap menolak akses materi untuk tamu, bukan hanya menyembunyikannya di tampilan

### D. Halaman Publik

- **D.1 Beranda**
  - D.1.1 Hero banner: latar gradient hijau, judul "Mulai langkah pertamumu menuju masa depan impian", subjudul tentang kelas online/video/latihan/tryout, tombol "Mulai Belajar" dan "Lihat Tryout", ilustrasi pelajar di kanan, badge jumlah siswa/kelas/soal
  - D.1.2 Menu belajar cepat (4 tombol pill): Tryout, Video Belajar, Kelas Online, Pilih Program
  - D.1.3 Program populer (kartu kategori): UTBK/SNBT, Seleksi Mandiri, CPNS, SKD Sekolah Kedinasan, Tes BUMN, Tes Kompetensi, program khusus lainnya
  - D.1.4 Paket rekomendasi; tiap kartu berisi thumbnail, nama paket, kategori, jumlah video, jumlah materi, jumlah tryout, masa aktif, harga normal, harga promo, rating, tombol "Lihat Detail" dan "Beli Sekarang"
  - D.1.5 Fitur unggulan: materi terstruktur, tryout real-time, pembahasan lengkap, analisis kemampuan, akses fleksibel
  - D.1.6 Statistik platform: jumlah siswa, kelas, soal, tryout selesai
  - D.1.7 Testimoni siswa dalam carousel
  - D.1.8 FAQ dalam accordion
  - D.1.9 Footer: tentang platform, produk, bantuan, kebijakan privasi, syarat dan ketentuan, kontak, media sosial, copyright
- **D.2 Katalog Program**
  - D.2.1 Search bar
  - D.2.2 Filter kategori, harga, tingkat pendidikan, rating, jenis program
  - D.2.3 Sorting: terbaru, terpopuler, harga termurah, harga tertinggi
  - D.2.4 Grid paket responsif
  - D.2.5 Pagination atau infinite scroll
- **D.3 Detail Paket**
  - D.3.1 Banner dan nama paket
  - D.3.2 Deskripsi lengkap
  - D.3.3 Harga, diskon, masa aktif
  - D.3.4 Daftar fitur
  - D.3.5 Silabus
  - D.3.6 Daftar materi, video, dan tryout
  - D.3.8 Rating dan ulasan
  - D.3.9 Pertanyaan umum
  - D.3.10 Tombol beli sticky di desktop
  - D.3.11 Rekomendasi paket serupa
- **D.4 Informasi / Artikel**
  - D.4.1 Jenis konten: artikel pendidikan, jadwal ujian, pengumuman, tips belajar, informasi pendaftaran
  - D.4.2 Isi tiap artikel: judul, cover, penulis, tanggal, isi, kategori, artikel terkait

### E. Autentikasi

- **E.1 Halaman**
  - E.1.1 Daftar
  - E.1.2 Masuk
  - E.1.3 Lupa password
  - E.1.4 Reset password
  - E.1.5 Verifikasi email
  - E.1.6 Lengkapi profil
- **E.2 Form pendaftaran**
  - E.2.1 Nama lengkap
  - E.2.2 Email
  - E.2.3 Nomor WhatsApp
  - E.2.4 Password dan konfirmasi password
  - E.2.5 Jenjang pendidikan
  - E.2.6 Target ujian
  - E.2.7 Persetujuan syarat dan ketentuan
- **E.3 Fitur pendukung**
  - E.3.1 Validasi form
  - E.3.2 Pesan kesalahan yang jelas
  - E.3.3 Indikator kekuatan password
  - E.3.4 Tampilkan/sembunyikan password
  - E.3.5 Login Google jika memungkinkan
  - E.3.6 Proteksi brute force
  - E.3.7 Rate limiting
  - E.3.8 Secure HTTP-only cookie

### F. Dashboard Siswa

- **F.1 Menu sidebar**: Ringkasan, Kelas Saya, Video Saya, Tryout Saya, Riwayat Hasil, Analisis Kemampuan, Transaksi, Sertifikat, Notifikasi, Profil, Keluar.
- **F.2 Halaman ringkasan**
  - F.2.1 Sapaan kepada siswa
  - F.2.2 Program aktif
  - F.2.3 Progres belajar
  - F.2.4 Jadwal tryout
  - F.2.5 Kelas terakhir yang diakses
  - F.2.6 Nilai tryout terbaru
  - F.2.7 Rata-rata nilai
  - F.2.8 Waktu belajar
  - F.2.9 Aktivitas terakhir
  - F.2.10 Rekomendasi materi berikutnya
- **F.3 Grafik**
  - F.3.1 Perkembangan nilai
  - F.3.2 Persentase penguasaan topik
  - F.3.3 Waktu belajar per minggu
  - F.3.4 Perbandingan nilai dengan rata-rata peserta

### G. Kelas Online

- **G.1 Sidebar kurikulum**: bab, subbab, video, PDF, tugas, kuis, status selesai/belum.
- **G.2 Area konten utama**
  - G.2.1 Video player
  - G.2.2 Judul dan deskripsi materi
  - G.2.3 Lampiran materi
  - G.2.4 Tombol materi sebelumnya/berikutnya
  - G.2.5 Tandai sebagai selesai
  - G.2.6 Catatan pribadi siswa
  - G.2.7 Kolom diskusi
- **G.3 Panel progres**: persentase penyelesaian, jumlah materi selesai, waktu belajar, target penyelesaian.
- **G.4 Fitur kelas**
  - G.4.1 Progres otomatis
  - G.4.2 Resume video dari waktu terakhir
  - G.4.3 Materi terkunci berdasarkan urutan
  - G.4.4 Unduh PDF
  - G.4.5 Kuis setelah materi
  - G.4.6 Sertifikat setelah semua materi selesai
  - G.4.7 Pencarian materi
  - G.4.8 Bookmark materi
  - G.4.9 Riwayat aktivitas belajar
  - G.4.10 Bab 1 dan 2 (pengenalan) setiap materi atau topik gratis untuk pengguna yang sudah login
  - G.4.11 Bab 3 dan seterusnya hanya terbuka setelah berlangganan
  - G.4.12 Bab terkunci berikon gembok; jika diklik muncul popup ajakan berlangganan ke paket terkait

### H. Video Belajar

- **H.1 Pustaka video (filter/atribut)**: kategori video, mata pelajaran, durasi, tingkat kesulitan, status sudah/belum ditonton.
- **H.2 Halaman video**
  - H.2.1 Video player responsif
  - H.2.2 Judul dan deskripsi
  - H.2.3 Transkrip
  - H.2.4 Materi terkait
  - H.2.5 Catatan siswa
  - H.2.6 Tombol simpan
  - H.2.7 Materi sebelumnya/berikutnya
  - H.2.8 Progres tontonan

### I. Tryout / Computer-Based Test (fitur utama)

- **I.1 Daftar tryout**: nama, kategori, jumlah soal, durasi, jadwal buka/tutup, jumlah percobaan, status (belum mulai/sedang dikerjakan/selesai), nilai tertinggi, tombol mulai.
- **I.2 Halaman petunjuk**: nama ujian, durasi, jumlah soal, sistem penilaian, aturan ujian, batas percobaan, checkbox persetujuan, tombol "Mulai Tryout".
- **I.3 Halaman pengerjaan soal**
  - I.3.1 Navbar ujian: nama tryout, nomor soal aktif, timer countdown, tombol keluar
  - I.3.2 Layout: area soal di kiri/tengah, panel navigasi soal di kanan
  - I.3.3 Komponen soal: nomor, isi pertanyaan, gambar (jika ada), pilihan A sampai E sebagai card, tombol ragu-ragu, sebelumnya, berikutnya, simpan jawaban
  - I.3.4 Panel daftar soal: semua nomor tampil, warna beda untuk belum dijawab/sudah dijawab/ragu-ragu/aktif, klik nomor untuk pindah soal
- **I.4 Fitur ujian**
  - I.4.1 Timer real-time
  - I.4.2 Autosave jawaban
  - I.4.3 Simpan waktu tersisa
  - I.4.4 Jawaban tetap ada setelah refresh
  - I.4.5 Peringatan saat sisa 10, 5, dan 1 menit
  - I.4.6 Auto-submit saat waktu habis
  - I.4.7 Konfirmasi sebelum mengakhiri ujian
  - I.4.8 Tampilkan jumlah soal belum dijawab
  - I.4.9 Cegah pengiriman ganda
  - I.4.10 Mode fullscreen (opsional)
  - I.4.11 Deteksi perpindahan tab (opsional)
  - I.4.12 Catat aktivitas ujian
  - I.4.13 Acak soal dan pilihan jawaban
  - I.4.14 Ujian per bagian/subtes
  - I.4.15 Durasi tersendiri per subtes
- **I.5 Jenis soal**
  - I.5.1 Pilihan ganda satu jawaban
  - I.5.2 Pilihan ganda banyak jawaban
  - I.5.3 Benar atau salah
  - I.5.4 Isian singkat
  - I.5.5 Angka/numerik
  - I.5.6 Essay
- **I.6 Halaman hasil**
  - I.6.1 Nilai akhir dan skor per subtes
  - I.6.2 Jumlah benar, salah, kosong
  - I.6.3 Waktu pengerjaan
  - I.6.4 Ranking dan persentil
  - I.6.5 Nilai rata-rata peserta
  - I.6.6 Passing grade dan status lulus/belum
  - I.6.7 Grafik radar kemampuan
  - I.6.8 Grafik nilai per topik
  - I.6.9 Rekomendasi materi yang harus dipelajari
  - I.6.10 Tombol lihat pembahasan
  - I.6.11 Tombol ulangi tryout jika diizinkan
- **I.7 Halaman pembahasan**
  - I.7.1 Nomor soal dan pertanyaan
  - I.7.2 Jawaban siswa dan jawaban benar
  - I.7.3 Status benar/salah (hijau/merah, tetap aksesibel)
  - I.7.4 Pembahasan lengkap
  - I.7.5 Video pembahasan jika ada
  - I.7.6 Topik dan tingkat kesulitan soal
  - I.7.7 Tombol soal sebelumnya/berikutnya
  - I.7.8 Navigasi seluruh nomor soal

### J. Penilaian dan Analisis

- **J.1 Konfigurasi penilaian**
  - J.1.1 Jawaban benar mendapat skor tertentu
  - J.1.2 Jawaban salah bernilai nol atau negatif
  - J.1.3 Jawaban kosong bernilai nol
  - J.1.4 Bobot berbeda per soal
  - J.1.5 Bobot berbeda per subtes
  - J.1.6 Passing grade diatur administrator
- **J.2 Analisis hasil siswa**
  - J.2.1 Nilai setiap topik
  - J.2.2 Tingkat penguasaan materi
  - J.2.3 Kecepatan menjawab
  - J.2.4 Akurasi jawaban
  - J.2.5 Rincian soal mudah, sedang, sulit
  - J.2.6 Perbandingan nilai antarpercobaan
  - J.2.7 Perbandingan dengan rata-rata peserta
  - J.2.8 Rekomendasi belajar otomatis berdasarkan kelemahan

### K. Keranjang dan Pembayaran

- **K.1 Alur**: pilih paket, masukkan keranjang, gunakan voucher, periksa pesanan, pilih metode bayar, bayar, verifikasi otomatis, aktivasi paket.
- **K.2 Metode pembayaran**
  - K.2.1 Virtual account
  - K.2.2 QRIS
  - K.2.3 E-wallet
  - K.2.4 Transfer bank
  - K.2.5 Simulasi pembayaran (demo)
- **K.3 Halaman transaksi**: nomor pesanan, produk, harga, diskon, total, metode bayar, batas pembayaran, status, tombol bayar, tombol lihat invoice.
- **K.4** Invoice dapat dicetak atau disimpan sebagai PDF.
- **K.5 Langganan**: berlangganan berarti membeli paket yang mencakup materi tersebut dan membayar lewat Midtrans; setelah berhasil, bab lanjutan terbuka selama masa aktif paket.

### L. Pengelolaan Materi oleh Administrator

- **L.1** Seluruh materi dan soal diinput administrator lewat panel administrator (menu Kelas, Video, Bank Soal, Tryout).
- **L.2 Fitur**
  - L.2.1 Membuat dan mengedit kelas
  - L.2.2 Mengatur bab dan materi dengan drag-and-drop
  - L.2.3 Mengunggah PDF
  - L.2.4 Menambahkan URL video
  - L.2.5 Membuat kuis dan soal
  - L.2.6 Melihat progres peserta
  - L.2.7 Menilai tugas dan essay
  - L.2.8 Menjawab diskusi
  - L.2.9 Mengunduh laporan nilai
  - L.2.10 Menandai bab pengenalan yang gratis (bawaan bab 1 dan 2) di setiap materi atau topik

### M. Panel Administrator

- **M.1 Menu sidebar (16)**: Dashboard, Pengguna, Program, Kelas, Video, Paket Produk, Tryout, Bank Soal, Transaksi, Voucher, Informasi, Banner, Testimoni, Sertifikat, Laporan, Pengaturan.
- **M.2 Dashboard admin**
  - M.2.1 Total pengguna dan pengguna baru
  - M.2.2 Total transaksi dan pendapatan
  - M.2.3 Program terlaris
  - M.2.4 Tryout terpopuler
  - M.2.5 Tingkat penyelesaian kelas
  - M.2.6 Aktivitas terbaru
  - M.2.7 Grafik pendapatan bulanan
  - M.2.8 Grafik pengguna baru
- **M.3 CRUD pengguna**: tambah, edit, nonaktifkan, reset password, ubah role, lihat riwayat belajar, lihat transaksi.
- **M.4 CRUD produk (field)**: nama, kategori, deskripsi, thumbnail, harga, harga promo, masa aktif, status publikasi, fitur paket, kelas dan tryout yang termasuk.
- **M.5 Bank soal**
  - M.5.1 Field: kategori ujian, mata pelajaran, topik, tingkat kesulitan, jenis soal, pertanyaan, pilihan jawaban, kunci jawaban, pembahasan, bobot, gambar, status publikasi, pembuat soal
  - M.5.2 Import soal via CSV/XLSX
  - M.5.3 Export bank soal
  - M.5.4 Preview soal
  - M.5.5 Duplikasi soal
  - M.5.6 Pencarian dan filter
  - M.5.7 Bulk delete
  - M.5.8 Bulk publish
- **M.6 Manajemen tryout**
  - M.6.1 Nama, deskripsi, gambar, kategori
  - M.6.2 Durasi dan jadwal
  - M.6.3 Jumlah percobaan
  - M.6.4 Acak soal dan acak opsi
  - M.6.5 Tampilkan pembahasan atau tidak, dan waktu pembahasan dibuka
  - M.6.6 Passing grade dan sistem penilaian
  - M.6.7 Daftar subtes
  - M.6.8 Pemilihan soal dari bank soal
  - M.6.9 Preview tryout

### N. Struktur Database (Prisma)

- **N.1 Pengguna**: User, Profile, Role
- **N.2 Kelas**: Course, CourseCategory, CourseSection, Lesson, Video, Material, Enrollment, LessonProgress
- **N.3 Kuis**: Quiz, QuizQuestion, QuizAttempt
- **N.4 Tryout**: Exam, ExamSection, Question, QuestionOption, ExamQuestion, ExamAttempt, ExamAnswer, ExamActivityLog, ExamResult, TopicAnalysis
- **N.5 Produk dan transaksi**: Product, ProductCourse, ProductExam, Cart, CartItem, Order, OrderItem, Payment, Voucher, VoucherUsage
- **N.6 Interaksi dan konten**: Review, Discussion, DiscussionReply, Notification, Article, Banner
- **N.7 Sertifikat dan sistem**: Certificate, UserCertificate, AuditLog, Setting, Media (metadata file Cloudinary)
- **N.8 Aturan tabel**
  - N.8.1 Setiap tabel punya id, createdAt, updatedAt
  - N.8.2 Foreign key
  - N.8.3 Index
  - N.8.4 Unique constraint
  - N.8.5 Soft delete untuk data penting
  - N.8.6 Enum untuk status
  - N.8.7 Relasi yang jelas

### O. Data Demo (Seed)

- **O.1 Pengguna**: 1 administrator dan 5 siswa.
- **O.2 Program**: Persiapan UTBK/SNBT, Persiapan SKD CPNS, Persiapan Sekolah Kedinasan, Tes Potensi Akademik.
- **O.3 Kelas**: Penalaran Umum, Pengetahuan Kuantitatif, Literasi Bahasa Indonesia, Tes Wawasan Kebangsaan, Tes Intelegensia Umum, Tes Karakteristik Pribadi.
- **O.4 Tryout**: Tryout UTBK Paket 1, Tryout SKD Paket 1, Tryout TPA Paket 1.
- **O.5 Isi minimal tiap tryout**: 2 subtes, 10 soal contoh, kunci jawaban, pembahasan, hasil demo.
- **O.6** Teks dan soal dummy orisinal, tidak menyalin dari website lain.

### P. Keamanan dan Kualitas

- **P.1 Keamanan**
  - P.1.1 Authentication dan authorization
  - P.1.2 Validasi sisi server
  - P.1.3 Sanitasi input
  - P.1.4 Rate limiting
  - P.1.5 CSRF protection jika dibutuhkan
  - P.1.6 Password hashing
  - P.1.7 Secure cookie
  - P.1.8 Proteksi halaman berdasarkan role
  - P.1.9 Validasi kepemilikan transaksi dan kelas
  - P.1.10 Audit log untuk tindakan admin
- **P.2 Kualitas UI**
  - P.2.1 Error handling
  - P.2.2 Loading state
  - P.2.3 Empty state
  - P.2.4 Skeleton loader
  - P.2.5 Toast notification
  - P.2.6 Confirmation dialog
  - P.2.7 Custom 404 page
  - P.2.8 Error page
- **P.3 Konfigurasi**: kunci API tidak disimpan di source code; pakai environment variables dan file `.env.example`.

### Q. Aksesibilitas dan SEO

- **Q.1 Aksesibilitas**
  - Q.1.1 Memenuhi WCAG dasar
  - Q.1.2 Navigasi keyboard
  - Q.1.3 Semua form punya label
  - Q.1.4 Kontras warna cukup
  - Q.1.5 Gambar punya alt text
  - Q.1.6 aria-label pada tombol bila perlu
  - Q.1.7 Heading tersusun hierarkis
- **Q.2 SEO**
  - Q.2.1 Metadata lengkap tiap halaman
  - Q.2.2 Open Graph metadata
  - Q.2.3 Sitemap
  - Q.2.4 robots.txt
  - Q.2.5 URL ramah SEO
  - Q.2.6 Schema markup untuk Course dan Article

### R. Output yang Harus Dihasilkan

R.1–R.21: struktur folder rapi, seluruh halaman frontend, komponen reusable, skema Prisma, migration, seed, autentikasi, dashboard berbasis role, kelas online, video, tryout lengkap, hasil dan pembahasan, keranjang dan transaksi, pengelolaan materi oleh admin, panel admin, API/server actions, dokumentasi instalasi, README.md (instalasi, perintah, akun demo, deploy Vercel + MySQL terkelola + Cloudinary), .env.example, akun demo admin dan siswa, dan tidak ada tombol mati.

### S. Tahap Pengerjaan

S.1–S.7 sama dengan bagian **Tahap pengerjaan** di atas (Tahap 1–6, dan jangan berhenti di landing page).

### T. Kriteria Keberhasilan

- T.1 Pengguna dapat mendaftar dan login
- T.2 Siswa dapat melihat dan membeli paket
- T.3 Paket yang dibeli muncul di dashboard siswa
- T.4 Siswa dapat membuka kelas dan menonton video
- T.5 Progres belajar tersimpan
- T.6 Siswa dapat memulai tryout
- T.7 Timer dan autosave berfungsi
- T.8 Siswa dapat berpindah soal
- T.9 Siswa dapat mengumpulkan ujian
- T.10 Skor dihitung otomatis
- T.11 Siswa dapat melihat hasil dan pembahasan
- T.12 Administrator dapat menginput materi dan soal
- T.13 Administrator dapat mengelola pengguna, produk, kelas, soal, tryout, dan transaksi
- T.14 Berfungsi baik di desktop dan mobile
- T.15 Tidak ada error di console
- T.16 Tidak ada tautan atau tombol yang tidak berfungsi
- T.17 Tamu dapat membuka halaman publik, dan popup login muncul saat tamu mencoba berinteraksi
- T.18 Bab 1 dan 2 terbuka setelah login, bab lanjutan terbuka setelah berlangganan lewat Midtrans
- **T.19 Urutan awal penyampaian**: arsitektur aplikasi, struktur database, sitemap, daftar komponen, lalu bangun aplikasi secara lengkap.
