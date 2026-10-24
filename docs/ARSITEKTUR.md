# Arsitektur Taman Pelajar

Dokumen Tahap 0 (butir **T.19**, **S.1**): arsitektur aplikasi, struktur database, sitemap, dan daftar komponen. Sumber kebenaran cakupan fitur tetap Lampiran di `CLAUDE.md`; nomor butir dirujuk dalam kurung.

---

## 1. Arsitektur aplikasi

### 1.1 Gambaran umum

```
                 ┌──────────────────────────── Vercel ─────────────────────────────┐
 Browser ──────▶ │ src/proxy.ts (proteksi route per role, cek JWT Auth.js)         │
 (tamu/USER/     │        │                                                        │
  ADMIN)         │        ▼                                                        │
                 │ Next.js App Router                                              │
                 │  ├─ Server Components ──▶ features/<domain>/queries.ts ─┐       │
                 │  ├─ Client Components (form, timer ujian, player, chart) │       │
                 │  │        │ panggil                                     │       │
                 │  │        ▼                                             ▼       │
                 │  ├─ Server Actions ──▶ features/<domain>/actions.ts ─▶ lib/rbac │
                 │  │                     (Zod → sesi/role → kepemilikan)    │     │
                 │  └─ Route Handlers app/api/* (webhook, upload, export)    │     │
                 │                                                           ▼     │
                 │                                       lib/prisma.ts (Prisma)    │
                 └───────────────────────────────────────────────┬─────────────────┘
                                                                 │
          ┌──────────────────────┬───────────────────────────────┼───────────────────┐
          ▼                      ▼                               ▼                   ▼
   MySQL 8 (lokal /       Cloudinary (gambar, PDF,        Midtrans Snap +       YouTube / Vimeo
   PlanetScale/Aiven/     sertifikat; signed URL          webhook (atau mode    (URL video, tidak
   TiDB)                  untuk file berbayar)            simulasi)             di-upload)
```

### 1.2 Lapisan dan tanggung jawab

| Lapisan | Lokasi | Tanggung jawab |
|---|---|---|
| Proteksi route | `src/proxy.ts` | Next.js 16 mengganti nama `middleware.ts` menjadi `proxy.ts` (fungsi sama). Memproteksi `/dashboard`, `/admin`, `/ujian`, `/keranjang`, `/checkout`, `/transaksi`; `/admin` khusus `ADMIN`. Redirect ke `/masuk?callbackUrl=…` (C.4, C.5.4) |
| Halaman | `src/app/**` | Server Components secara default; hanya membaca lewat `queries.ts` |
| Baca data | `src/features/<domain>/queries.ts` | Query Prisma + cek akses (`requireRole`, `canAccessLesson`) |
| Mutasi | `src/features/<domain>/actions.ts` | Server Actions: Zod di server, cek sesi/role, cek kepemilikan, kembalikan `{ ok: true, data } \| { ok: false, error }` |
| Skema validasi | `src/features/<domain>/schemas.ts` | Skema Zod dipakai bersama client (React Hook Form) dan server |
| Endpoint eksternal | `src/app/api/**` | Auth.js, webhook Midtrans, signature upload Cloudinary, export CSV/XLSX |
| Pustaka bersama | `src/lib/*` | `prisma`, `auth`, `rbac`, `access`, `cloudinary`, `payment` (`PaymentProvider`), `rate-limit`, `sanitize`, `format`, `utils` |
| Penilaian | `src/features/scoring/` | Fungsi murni penilaian (J.1), diuji unit dengan Vitest |

### 1.3 Domain fitur (`src/features/`)

`auth`, `catalog`, `course`, `video`, `exam`, `scoring`, `cart`, `payment`, `admin`, `article`, `notification`, `certificate`. Ditambah `review`, `discussion`, `voucher`, dan `analytics` bila sebuah domain menjadi terlalu besar.

### 1.4 Alur kunci

**Autentikasi (E, P.1).** Auth.js v5 dengan Credentials (bcrypt) dan Google OAuth. Session berupa JWT di cookie HTTP-only secure yang membawa `id` dan `role`. Rate limit (`lib/rate-limit.ts`, tabel `RateLimit` di MySQL agar berfungsi di serverless) untuk masuk, daftar, lupa password, dan submit ujian.

**Akses materi (C.5, G.4.10–G.4.12, K.5).** `canAccessLesson(user, lesson)` di `lib/access.ts`:
1. Tamu ditolak.
2. `CourseSection.isFree = true` (bawaan bab 1–2): terbuka untuk user login.
3. Selain itu harus ada `Enrollment` berstatus `AKTIF` dengan `expiresAt > now`, dari Product yang mencakup Course tersebut (`ProductCourse`).

Helper ini dipakai di query lesson, saat membuat signed URL Cloudinary, dan saat mengirim URL video. Untuk bab terkunci, URL tidak pernah dikirim ke client.

**Tryout CBT (I, J).**
1. Halaman petunjuk → `startAttempt` (transaksi). Cek batas percobaan dan jadwal, lalu buat `ExamAttempt` dengan `startedAt`, `deadlineAt`, dan `seed`. Per subtes, `ExamAttemptSection` menyimpan `startedAt`/`deadlineAt` masing-masing.
2. `/ujian/[attemptId]` memuat soal tanpa kunci jawaban. Urutan soal dan opsi diturunkan dari `seed` (PRNG deterministik), sehingga sama setelah refresh.
3. `saveAnswer` (debounce 1 detik) melakukan upsert `ExamAnswer` termasuk `isDoubtful`. Server menolak bila `now > deadlineAt` atau attempt tidak `BERLANGSUNG`.
4. Countdown dihitung dari `deadlineAt` yang dikirim server. Ada peringatan 10/5/1 menit; saat habis, client memanggil `submitAttempt`.
5. `submitAttempt` berjalan dalam `$transaction`: kunci baris attempt, keluar jika status sudah `SELESAI` (idempoten), hitung skor lewat `features/scoring`, lalu tulis `ExamResult`, `ExamResultSection`, dan `TopicAnalysis`.
6. Attempt yang kedaluwarsa dan diakses kembali otomatis di-submit di server.
7. `ExamActivityLog` mencatat mulai, pindah tab, keluar fullscreen, dan submit.
8. Pembahasan hanya dikirim jika attempt `SELESAI` dan `Exam.discussionOpensAt` (atau `showDiscussion`) mengizinkan.

**Pembayaran (K).** Keranjang → voucher → `createOrder` (transaksi: snapshot harga, `VoucherUsage`) → `PaymentProvider.createPayment()`:
- `simulasi`: halaman bayar demo dengan tombol "Bayar sekarang" / "Gagalkan".
- `midtrans`: Snap token, lalu `/api/webhooks/midtrans` memverifikasi signature SHA512.

Semua jalur bermuara ke `activateOrder(orderId)`, satu fungsi idempoten yang membuat `Enrollment` hanya dari status `BERHASIL`. Pemilihan provider lewat env `PAYMENT_MODE`.

**File (Cloudinary).** Client meminta signature ke `/api/upload` (cek role, tipe, ukuran: gambar ≤ 5 MB, PDF ≤ 20 MB, folder `tamanpelajar/<domain>`). Setelah upload, metadata disimpan ke `Media`. File publik memakai delivery `upload` dengan `f_auto,q_auto`. PDF materi dan sertifikat memakai `authenticated` dan dikirim lewat signed URL berumur pendek setelah cek akses.

### 1.5 Keputusan teknis

| Keputusan | Alasan |
|---|---|
| Next.js 16.4 + `cacheComponents` (sudah aktif di `next.config.ts`) | Halaman publik bisa di-cache, bagian personal di-stream. Data per user dibaca di dalam `<Suspense>` |
| Tailwind v4 lewat loader `@tailwindcss/turbopack` | Konfigurasi bawaan proyek; token didefinisikan di `@theme` pada `globals.css` |
| Prisma + MySQL dengan foreign key aktif | Bila host produksi tidak mendukung FK (mis. PlanetScale), ganti ke `relationMode = "prisma"`; semua relasi sudah punya `@@index` |
| Rate limit berbasis tabel MySQL | Tanpa layanan tambahan (Redis) dan tetap berfungsi di Vercel serverless |
| Sanitasi HTML dengan `sanitize-html` di server | Untuk artikel, soal, pembahasan, dan diskusi (P.1.3) |

---

## 2. Struktur database (rancangan Prisma, MySQL 8)

Rancangan ini diterapkan sebagai migration pada **Tahap 2**. Di Tahap 0, `prisma/schema.prisma` baru berisi `generator` dan `datasource`.

Aturan umum (N.8):
- Setiap model punya `id String @id @default(cuid())`, `createdAt`, dan `updatedAt` (tidak ditulis ulang di bawah agar ringkas).
- Teks panjang memakai `@db.Text` atau `@db.LongText`.
- Setiap foreign key dan kolom filter diberi `@@index`.
- Soft delete (`deletedAt`) untuk User, Course, Product, Exam, Question, dan Order.

### 2.1 Enum

```prisma
enum Role              { ADMIN USER }
enum EducationLevel    { SMP SMA SMK D3 S1 S2 UMUM }
enum PublishStatus     { DRAF TERBIT ARSIP }
enum Difficulty        { MUDAH SEDANG SULIT }
enum LessonType        { VIDEO PDF TEKS KUIS TUGAS }
enum VideoProvider     { YOUTUBE VIMEO EKSTERNAL }
enum EnrollmentStatus  { AKTIF KEDALUWARSA DIBATALKAN }
enum QuestionType      { PG_TUNGGAL PG_JAMAK BENAR_SALAH ISIAN_SINGKAT NUMERIK ESSAY }
enum AttemptStatus     { BERLANGSUNG SELESAI KEDALUWARSA }
enum ActivityType      { MULAI PINDAH_TAB KELUAR_FULLSCREEN MASUK_FULLSCREEN SUBMIT AUTO_SUBMIT }
enum OrderStatus       { MENUNGGU BERHASIL GAGAL KEDALUWARSA DIKEMBALIKAN }
enum PaymentStatus     { MENUNGGU BERHASIL GAGAL KEDALUWARSA DIKEMBALIKAN }
enum PaymentMethod     { VIRTUAL_ACCOUNT QRIS E_WALLET TRANSFER_BANK SIMULASI }
enum DiscountType      { PERSEN NOMINAL }
enum ArticleCategory   { ARTIKEL JADWAL_UJIAN PENGUMUMAN TIPS_BELAJAR PENDAFTARAN }
enum NotificationType  { TRANSAKSI TRYOUT KELAS SISTEM }
enum MediaResourceType { IMAGE RAW VIDEO }
enum MediaDelivery     { UPLOAD AUTHENTICATED }
enum ProgramType       { KELAS TRYOUT BUNDEL }
```

### 2.2 Pengguna (N.1)

```prisma
model User {
  email          String    @unique
  emailVerified  DateTime?
  passwordHash   String?            // null untuk akun Google saja
  name           String
  image          String?
  role           Role      @default(USER)
  isActive       Boolean   @default(true)   // nonaktifkan (M.3)
  failedLogins   Int       @default(0)      // brute force (E.3.6)
  lockedUntil    DateTime?
  deletedAt      DateTime?
  profile Profile?  accounts Account[]  enrollments Enrollment[]  attempts ExamAttempt[]
  orders Order[]  cart Cart?  notifications Notification[]  ...
  @@index([role]) @@index([deletedAt])
}
model Profile { userId @unique, phone, educationLevel EducationLevel?, examTarget String?,
                school String?, city String?, birthDate DateTime?, completedAt DateTime? }
// Tabel Auth.js: Account, VerificationToken (verifikasi email), PasswordResetToken
model PasswordResetToken { userId, tokenHash @unique, expiresAt, usedAt? }
```

### 2.3 Kelas (N.2)

```prisma
model CourseCategory { name, slug @unique, description @db.Text?, order Int, iconName? }
// Program (UTBK/SNBT, CPNS, ...), dipakai bersama Course, Product, Exam, Video

model Course {
  slug @unique, title, summary, description @db.Text, categoryId, thumbnailId? (Media),
  subject, level Difficulty, status PublishStatus, sequentialLock Boolean @default(false) // G.4.3
  certificateId?, estimatedMinutes Int, deletedAt?
  @@index([categoryId]) @@index([status]) @@index([slug])
}
model CourseSection { courseId, title, order Int, isFree Boolean @default(false) // G.4.10, L.2.10
                      @@unique([courseId, order]) }
model Lesson   { sectionId, slug, title, type LessonType, content @db.LongText?, order Int,
                 durationSec Int?, videoId? (Video), quizId? (Quiz)  @@unique([sectionId, slug]) }
model Video    { slug @unique, title, description @db.Text, transcript @db.LongText?, provider VideoProvider,
                 url String @db.Text, durationSec Int, subject, difficulty Difficulty, categoryId,
                 thumbnailId?, status PublishStatus }
model Material { lessonId, title, mediaId (Media, delivery AUTHENTICATED) }      // PDF lampiran
model Enrollment { userId, productId, orderId?, status EnrollmentStatus, startsAt, expiresAt
                   @@unique([userId, productId]) @@index([userId, status]) }
model LessonProgress { userId, lessonId, completedAt?, lastPositionSec Int @default(0), // G.4.2
                       watchedSec Int @default(0)  @@unique([userId, lessonId]) }
model VideoProgress  { userId, videoId, lastPositionSec, watchedSec, completedAt? } // H.2.8
model LessonNote     { userId, lessonId?, videoId?, content @db.Text }            // G.2.6, H.2.5
model Bookmark       { userId, lessonId?, videoId? }                               // G.4.8, H.2.6
model LearningSession { userId, courseId?, lessonId?, videoId?, seconds Int, date @db.Date } // F.2.8, F.3.3
```

### 2.4 Kuis (N.3)

```prisma
model Quiz         { title, lessonId?, passingScore Int, timeLimitSec Int? }
model QuizQuestion { quizId, questionId (Question), order Int  @@unique([quizId, questionId]) }
model QuizAttempt  { quizId, userId, score Float, answers Json, submittedAt }
```

Kuis memakai bank soal yang sama dengan tryout (`Question`).

### 2.5 Tryout (N.4)

```prisma
model Exam {
  slug @unique, title, description @db.Text, imageId?, categoryId,
  durationMin Int, opensAt?, closesAt?, maxAttempts Int @default(1),
  shuffleQuestions Boolean, shuffleOptions Boolean,                     // M.6.4
  showDiscussion Boolean, discussionOpensAt DateTime?,                  // M.6.5
  passingGrade Float, scoringMode String, wrongScore Float @default(0), // J.1
  status PublishStatus, deletedAt?
}
model ExamSection  { examId, title, order, durationMin Int?, weight Float @default(1),  // I.4.14–15, J.1.5
                     passingGrade Float? }
model Question {
  categoryId, subject, topic, difficulty Difficulty, type QuestionType,
  body @db.LongText, imageId?, explanation @db.LongText, explanationVideoUrl?,
  correctText String?, correctNumber Float?, tolerance Float?,         // isian / numerik
  weight Float @default(1), status PublishStatus, createdById, deletedAt?
  @@index([categoryId]) @@index([topic]) @@index([status])
}
model QuestionOption { questionId, label String, body @db.Text, imageId?, isCorrect Boolean, order }
model ExamQuestion   { examId, sectionId, questionId, order, weight Float?  @@unique([sectionId, questionId]) }
model ExamAttempt {
  examId, userId, attemptNo Int, status AttemptStatus, seed Int,
  startedAt, deadlineAt, submittedAt?, currentQuestionId?,
  @@unique([examId, userId, attemptNo]) @@index([userId, status])
}
model ExamAttemptSection { attemptId, sectionId, startedAt?, deadlineAt?, submittedAt? }
model ExamAnswer   { attemptId, questionId, optionIds Json?, textAnswer @db.Text?, numberAnswer Float?,
                     isDoubtful Boolean, timeSpentSec Int, isCorrect Boolean?, score Float?,
                     gradedById?  // essay dinilai admin (L.2.7)
                     @@unique([attemptId, questionId]) }
model ExamActivityLog { attemptId, type ActivityType, meta Json?, at DateTime }
model ExamResult  { attemptId @unique, totalScore Float, correct Int, wrong Int, empty Int,
                    durationSec Int, passed Boolean, rank Int?, percentile Float? }
model ExamResultSection { resultId, sectionId, score Float, correct, wrong, empty }
model TopicAnalysis { resultId, topic, correct, total, mastery Float, avgTimeSec Float } // J.2
```

### 2.6 Produk dan transaksi (N.5)

```prisma
model Product { slug @unique, name, categoryId, programType ProgramType, educationLevel EducationLevel?,
                summary, description @db.Text, thumbnailId?, price Int, promoPrice Int?,
                activeDays Int, features Json, faq Json, status PublishStatus, salesCount Int, deletedAt? }
model ProductCourse { productId, courseId  @@unique([productId, courseId]) }
model ProductExam   { productId, examId    @@unique([productId, examId]) }
model ProductVideo  { productId, videoId   @@unique([productId, videoId]) }
model Cart     { userId @unique }
model CartItem { cartId, productId  @@unique([cartId, productId]) }
model Order    { number String @unique,            // TP-20261024-0001
                 userId, subtotal Int, discount Int, total Int, voucherId?,
                 status OrderStatus, expiresAt, paidAt?, deletedAt?  @@index([userId, status]) }
model OrderItem { orderId, productId, nameSnapshot, price Int, promoPrice Int?, activeDays Int }
model Payment  { orderId, provider String, method PaymentMethod, status PaymentStatus,
                 externalId String? @unique, snapToken?, vaNumber?, qrString? @db.Text,
                 rawResponse Json?, paidAt? }
model Voucher  { code @unique, description, discountType DiscountType, value Int, maxDiscount Int?,
                 minPurchase Int, quota Int?, perUserLimit Int, startsAt, endsAt, isActive }
model VoucherUsage { voucherId, userId, orderId @unique }
```

Semua nilai uang memakai `Int` dalam rupiah.

### 2.7 Interaksi dan konten (N.6)

```prisma
model Review     { userId, productId, rating Int, body @db.Text, isPublished  @@unique([userId, productId]) }
model Discussion { lessonId?, videoId?, userId, body @db.Text }
model DiscussionReply { discussionId, userId, body @db.Text }          // admin menjawab (L.2.8)
model Notification { userId, type NotificationType, title, body @db.Text, href?, readAt? }
model Article    { slug @unique, title, excerpt, body @db.LongText, coverId?, category ArticleCategory,
                   authorId, status PublishStatus, publishedAt? }
model Banner     { title, imageId, href?, order, isActive, startsAt?, endsAt? }
model Testimonial { name, program, body @db.Text, isPublished, order }  // D.1.7, menu Testimoni M.1
```

### 2.8 Sertifikat dan sistem (N.7)

```prisma
model Certificate     { title, courseId?, templateMediaId? }
model UserCertificate { certificateId, userId, number @unique, mediaId?, issuedAt }
model AuditLog  { actorId, action, entity, entityId, before Json?, after Json?, ip? } // P.1.10
model Setting   { key @unique, value Json }
model Media     { publicId @unique, resourceType MediaResourceType, format, version Int, bytes Int,
                  width Int?, height Int?, deliveryType MediaDelivery, folder, uploadedById }
model RateLimit { key @unique, count Int, resetAt DateTime }               // P.1.4
```

### 2.9 Relasi utama

```
User 1─1 Profile        User 1─* Enrollment *─1 Product *─* Course (ProductCourse)
                                               Product *─* Exam   (ProductExam)
Course 1─* CourseSection 1─* Lesson ─? Video / Quiz / Material
Exam 1─* ExamSection 1─* ExamQuestion *─1 Question 1─* QuestionOption
User 1─* ExamAttempt 1─* ExamAnswer   ExamAttempt 1─1 ExamResult 1─* TopicAnalysis
User 1─* Order 1─* OrderItem   Order 1─* Payment   Order ─? Voucher (VoucherUsage)
```

---

## 3. Sitemap

Keterangan: **P** = publik (tamu boleh), **U** = harus login (USER/ADMIN), **A** = khusus ADMIN.

### 3.1 Publik `(public)`

| Rute | Akses | Butir |
|---|---|---|
| `/` beranda | P | D.1 |
| `/program` katalog (search, filter, sort, pagination) | P | D.2 |
| `/program?kategori=<slug>` katalog per kategori (parameter, bukan segmen) | P | D.1.3 |
| `/paket/[slug]` detail paket | P | D.3 |
| `/kelas` daftar kelas online | P | C.5.1 |
| `/kelas/[slug]` ruang belajar (bab gratis/terkunci) | P (lihat), U (buka materi) | G |
| `/kelas/[slug]/[lessonSlug]` materi | U + `canAccessLesson` | G.2 |
| `/video` pustaka video | P | H.1 |
| `/video/[slug]` halaman video | P (lihat), U (putar) | H.2 |
| `/tryout` daftar tryout | P | I.1 |
| `/tryout/[slug]` petunjuk | P (lihat), U (mulai) | I.2 |
| `/tryout/hasil/[attemptId]` hasil | U (pemilik) | I.6 |
| `/tryout/pembahasan/[attemptId]` pembahasan | U (pemilik) | I.7 |
| `/informasi` daftar artikel | P | D.4 |
| `/informasi/[slug]` artikel | P | D.4.2 |
| `/cari` hasil pencarian global | P | B.2.3 |
| `/tentang`, `/bantuan`, `/kebijakan-privasi`, `/syarat-ketentuan`, `/kontak` | P | D.1.9 |
| `/sertifikat/[nomor]` (cetak dan verifikasi) | P | C.1.9 |

### 3.2 Autentikasi `(auth)`

`/masuk`, `/daftar`, `/lupa-password`, `/reset-password/[token]`, `/verifikasi-email`, `/lengkapi-profil` (U). Butir E.1.

### 3.3 Ujian (layout khusus, tanpa navbar utama)

`/ujian/[attemptId]` (U, pemilik, attempt `BERLANGSUNG`). Butir I.3–I.4.

### 3.4 Transaksi (U)

| Rute | Butir |
|---|---|
| `/keranjang` | K.1 |
| `/checkout` (voucher, periksa pesanan, metode bayar) | K.1, K.2 |
| `/checkout/bayar/[orderNumber]` (Snap / simulasi) | K.2.5 |
| `/transaksi` dan `/transaksi/[orderNumber]` | K.3 |
| `/invoice/[orderNumber]` (CSS print) | K.4 |

### 3.5 Dashboard siswa `(user)/dashboard` (U)

| Rute | Butir |
|---|---|
| `/dashboard` ringkasan | F.2, F.3 |
| `/dashboard/kelas` | F.1 |
| `/dashboard/video` | F.1 |
| `/dashboard/tryout` | F.1, F.2.4 |
| `/dashboard/riwayat` | F.1 |
| `/dashboard/analisis` | F.3, J.2 |
| `/dashboard/transaksi` (riwayat pesanan; `/transaksi` sementara dialihkan ke sini sampai Tahap 4) | F.1 |
| `/dashboard/sertifikat` | C.1.9 |
| `/dashboard/notifikasi` | F.1 |
| `/dashboard/profil` (ubah profil dan password) | F.1 |

"Keluar" adalah aksi `signOut`, bukan halaman.

### 3.6 Panel administrator `/admin` (A), 16 menu (M.1)

| Rute | Butir |
|---|---|
| `/admin` dashboard | M.2 |
| `/admin/pengguna`, `/admin/pengguna/[id]` | M.3 |
| `/admin/program` (CourseCategory) | M.1 |
| `/admin/kelas`, `/admin/kelas/baru`, `/admin/kelas/[id]` (bab/materi drag-and-drop, bab gratis), `/admin/kelas/[id]/peserta` | L.2, C.2.5 |
| `/admin/video`, `/admin/video/[id]` | L.2.4 |
| `/admin/produk`, `/admin/produk/[id]` | M.4 |
| `/admin/tryout`, `/admin/tryout/[id]` (subtes, pilih soal), `/admin/tryout/[id]/preview`, `/admin/tryout/[id]/hasil` | M.6 |
| `/admin/bank-soal`, `/admin/bank-soal/[id]`, `/admin/bank-soal/impor` | M.5 |
| `/admin/penilaian` (essay dan tugas) | L.2.7 |
| `/admin/diskusi` | L.2.8 |
| `/admin/transaksi`, `/admin/transaksi/[id]` | C.2.6 |
| `/admin/voucher` | C.2.7 |
| `/admin/informasi`, `/admin/informasi/[id]` | C.2.8 |
| `/admin/banner` | C.2.8 |
| `/admin/testimoni` | M.1 |
| `/admin/sertifikat` | M.1 |
| `/admin/laporan` (export nilai/transaksi) | M.2, L.2.9 |
| `/admin/pengaturan` | M.1 |
| `/admin/audit-log` | P.1.10 |

### 3.7 Route handler `api/`

| Route | Fungsi |
|---|---|
| `/api/auth/[...nextauth]` | Auth.js |
| `/api/upload/signature` | Signature Cloudinary |
| `/api/media/[id]` | Redirect ke signed URL setelah cek akses |
| `/api/webhooks/midtrans` | Webhook Midtrans |
| `/api/export/bank-soal` | Export bank soal |
| `/api/export/nilai/[examId]` | Export nilai |
| `/api/export/transaksi` | Export transaksi |

### 3.8 Sistem

| Rute | Keterangan |
|---|---|
| `not-found.tsx`, `error.tsx`, `global-error.tsx` | P.2.7, P.2.8 |
| `sitemap.ts`, `robots.ts`, `opengraph-image` | Q.2 |
| `/style-guide` | Hanya development; 404 di produksi |

---

## 4. Daftar komponen

### 4.1 `components/ui` (shadcn, tidak diubah sembarangan)

button, input, textarea, label, select, checkbox, radio-group, switch, form, dialog, alert-dialog, sheet, dropdown-menu, popover, command, tabs, accordion, badge, card, table, pagination, progress, skeleton, separator, tooltip, avatar, sonner (toast), carousel, scroll-area, calendar.

### 4.2 `components/layout`

| Komponen | Keterangan |
|---|---|
| `SiteHeader` | Navbar sticky: logo, 6 menu, pencarian, notifikasi, avatar/Masuk-Daftar (B.2) |
| `MobileNav` | Hamburger (B.3.1) |
| `BottomNav` | Beranda, Belajar, Tryout, Transaksi, Profil (B.3.2) |
| `SiteFooter` | Baris kontak bergaya logo (D.1.9) |
| `DashboardSidebar`, `AdminSidebar` | Sidebar dashboard siswa dan admin |
| `ExamHeader` | Navbar ujian (I.3.1) |
| `Logo` | Tanda tunas (`next/image`) + tulisan kapital; `SproutMark` untuk ornamen |

### 4.3 `components/shared`

| Komponen | Keterangan |
|---|---|
| `ProductCard` | Kartu paket (D.1.4) |
| `CategoryCard` | Kartu program (D.1.3) |
| `PriceTag` | Format IDR, harga coret |
| `RatingStars` | Rating |
| `EmptyState` | Ikon tunas + pesan + aksi |
| `ConfirmDialog` | Dialog konfirmasi aksi berisiko |
| `LoginRequiredDialog` dan hook `useRequireLogin()` | C.5.3 |
| `SubscribeDialog` | Ajakan berlangganan bab terkunci (G.4.12) |
| `SearchBar` | Pencarian |
| `FilterPanel` | Filter katalog |
| `SortSelect` | Urutan katalog |
| `DataPagination` | Pagination |
| `PageHeader` | Judul halaman |
| `SproutDivider` | Pembatas section bermotif tunas |
| `OrganicCorner` | SVG lengkung hijau dan gelombang abu, satu pasang per layar |
| `DotPattern` | Aksen pola titik |
| `CheckList` | Daftar keunggulan dengan `CircleCheck` |
| `GrowthProgress` | Progres "tumbuh" |
| `StatNumber` | Angka `tabular-nums` |
| `JsonLd` | Schema markup |
| `RichText` | HTML tersanitasi |
| Skeleton per konten | `ProductCardSkeleton`, `TableSkeleton`, `LessonSkeleton` |

### 4.4 `components/exam`

| Komponen | Keterangan |
|---|---|
| `ExamTimer` | Dari `deadlineAt`, peringatan 10/5/1 menit |
| `QuestionView` | Satu komponen per jenis soal: `ChoiceSingle`, `ChoiceMultiple`, `TrueFalse`, `ShortAnswer`, `NumericAnswer`, `EssayAnswer` |
| `OptionCard` | Kartu pilihan jawaban |
| `QuestionNavigator` | Status: belum, dijawab, ragu, aktif; dibedakan warna **dan** ikon |
| `DoubtToggle` | Tombol ragu-ragu |
| `ExamFooterNav` | Sebelumnya, berikutnya, simpan |
| `SubmitExamDialog` | Menampilkan jumlah soal kosong |
| `SectionTransition` | Perpindahan subtes |
| `AutosaveIndicator` | Status autosave |
| `ActivityTracker` | Tab dan fullscreen |
| `ResultSummary` | Ringkasan hasil |
| `SectionScoreTable` | Skor per subtes |
| `ReviewQuestion` | Status dengan ikon dan teks |
| `ReviewNavigator` | Navigasi nomor di pembahasan |

### 4.5 `components/course`

`CurriculumSidebar`, `LessonContent`, `VideoPlayer` (YouTube/Vimeo/URL, resume posisi), `LessonAttachments`, `LessonNav`, `MarkCompleteButton`, `LessonNotes`, `DiscussionThread`, `CourseProgressPanel`, `LockedLessonItem`, `LessonSearch`, `BookmarkButton`.

### 4.6 `components/admin`

| Komponen | Keterangan |
|---|---|
| `DataTable` | TanStack Table: sort, filter, seleksi bulk |
| `MediaUploader` | Signature Cloudinary |
| `SortableList` | Drag-and-drop bab/materi |
| `QuestionEditor` | Editor soal |
| `QuestionPicker` | Pilih soal dari bank soal |
| `CsvImportDialog` | Impor soal |
| `StatusBadge` | Badge status |
| `AdminStatCard` | Kartu statistik admin |
| `RichTextEditor` | Editor konten |

### 4.7 `components/charts` (Recharts)

`ScoreTrendChart` (F.3.1), `TopicMasteryChart` (F.3.2), `StudyTimeChart` (F.3.3), `CompareAverageChart` (F.3.4), `AbilityRadarChart` (I.6.7), `TopicScoreBar` (I.6.8), `RevenueChart` (M.2.7), `NewUsersChart` (M.2.8).

---

## 5. Design system (ringkas)

Token warna dari bagian Desain di `CLAUDE.md` didefinisikan sebagai CSS variable di `src/app/globals.css` dan dipetakan ke `@theme` Tailwind v4, sehingga kelas seperti `bg-primary`, `text-olive`, `bg-leaf`, dan `text-bark` tersedia.

| Unsur | Pengaturan |
|---|---|
| Font | Plus Jakarta Sans lewat `next/font/google` (`--font-sans`) |
| Radius | Dasar 12 px (`--radius`), maksimum 20 px |
| Shadow | Lembut, secukupnya |

Logo: `public/logo-taman-pelajar.jpeg` (tanda tunas dari `brand/logo.jpeg`) + tulisan HTML "TAMAN PELAJAR". Referensi visual: `brand/reference.jpeg`.
