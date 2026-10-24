// Program, kelas, paket, testimoni, artikel, voucher (O.2, O.3). Semua teks orisinal.

export const categories = [
  { slug: "utbk-snbt", name: "UTBK/SNBT", shortName: "UTBK", audience: "Siswa kelas 12 dan gap year", description: "Tes Potensi Skolastik, literasi, dan penalaran matematika untuk masuk PTN." },
  { slug: "seleksi-mandiri", name: "Seleksi Mandiri PTN", shortName: "SM", audience: "Siswa yang mengincar jalur mandiri", description: "Latihan soal ujian mandiri dengan pola yang berbeda dari UTBK." },
  { slug: "cpns", name: "SKD CPNS", shortName: "SKD", audience: "Pelamar CPNS lulusan SMA hingga S2", description: "TWK, TIU, dan TKP sesuai kisi-kisi Seleksi Kompetensi Dasar." },
  { slug: "sekolah-kedinasan", name: "SKD Sekolah Kedinasan", shortName: "SKD-K", audience: "Lulusan SMA/SMK", description: "Persiapan seleksi STAN, STIS, IPDN, dan sekolah kedinasan lain." },
  { slug: "tes-bumn", name: "Tes BUMN", shortName: "BUMN", audience: "Lulusan D3 dan S1", description: "Tes kemampuan dasar, wawasan kebangsaan, dan AKHLAK untuk rekrutmen bersama." },
  { slug: "tes-potensi-akademik", name: "Tes Potensi Akademik", shortName: "TPA", audience: "Calon mahasiswa pascasarjana", description: "Verbal, numerik, dan figural untuk seleksi S2 dan beasiswa." },
  { slug: "tes-kompetensi", name: "Tes Kompetensi", shortName: "TK", audience: "Pekerja dan profesional", description: "Program khusus: kompetensi bidang, sertifikasi, dan seleksi internal." },
];

export interface SeedCourse {
  slug: string;
  title: string;
  category: string;
  subject: string;
  level: "MUDAH" | "SEDANG" | "SULIT";
  summary: string;
  description: string;
  chapters: { title: string; lessons: string[]; quiz?: string[] }[];
}

// Bab 1–2 setiap kelas ditandai gratis di seed (G.4.10).
export const courses: SeedCourse[] = [
  {
    slug: "penalaran-umum",
    title: "Penalaran Umum",
    category: "utbk-snbt",
    subject: "Penalaran Umum",
    level: "SEDANG",
    summary: "Logika, penalaran analitik, dan penalaran kuantitatif untuk subtes UTBK.",
    description:
      "Kelas ini membahas pola soal penalaran UTBK satu per satu. Setiap bab dimulai dari konsep, lalu contoh soal dengan langkah penyelesaian, dan ditutup kuis singkat.",
    chapters: [
      { title: "Mengenal soal penalaran", lessons: ["Jenis soal dan cara membaca pola", "Strategi waktu per soal"] },
      { title: "Logika proposisi", lessons: ["Implikasi dan kontraposisi", "Silogisme"], quiz: ["utbk-pu-1", "utbk-pu-2", "utbk-pu-4"] },
      { title: "Penalaran analitik", lessons: ["Soal penjadwalan", "Soal urutan posisi", "Soal syarat ganda"] },
      { title: "Penalaran kuantitatif", lessons: ["Pola bilangan", "Membaca tabel dan grafik"], quiz: ["utbk-pu-3", "utbk-pu-5"] },
    ],
  },
  {
    slug: "pengetahuan-kuantitatif",
    title: "Pengetahuan Kuantitatif",
    category: "utbk-snbt",
    subject: "Pengetahuan Kuantitatif",
    level: "SEDANG",
    summary: "Aljabar, statistika, peluang, dan geometri yang paling sering muncul di UTBK.",
    description:
      "Materi kuantitatif disusun dari rumus yang paling sering dipakai. Fokusnya memilih cara tercepat, bukan menghafal semua rumus.",
    chapters: [
      { title: "Peta materi kuantitatif", lessons: ["Apa yang diuji", "Rumus yang paling sering keluar"] },
      { title: "Aljabar dasar", lessons: ["Persamaan linear", "Pertidaksamaan"], quiz: ["utbk-pk-2", "utbk-pk-3"] },
      { title: "Statistika dan peluang", lessons: ["Rata-rata, median, modus", "Peluang kejadian majemuk"] },
      { title: "Geometri", lessons: ["Bangun datar", "Teorema Pythagoras"], quiz: ["utbk-pk-1", "utbk-pk-4", "utbk-pk-5"] },
    ],
  },
  {
    slug: "literasi-bahasa-indonesia",
    title: "Literasi Bahasa Indonesia",
    category: "utbk-snbt",
    subject: "Literasi Bahasa Indonesia",
    level: "MUDAH",
    summary: "Membaca cepat, gagasan utama, simpulan, dan kalimat efektif.",
    description:
      "Untuk siswa yang sering kehabisan waktu di soal bacaan panjang. Latihan dilakukan dengan batas waktu agar terbiasa membaca cepat tanpa kehilangan isi.",
    chapters: [
      { title: "Membaca untuk ujian", lessons: ["Membaca cepat tanpa kehilangan isi", "Menandai kata kunci"] },
      { title: "Gagasan utama", lessons: ["Gagasan eksplisit", "Gagasan implisit"], quiz: ["tpa-v-4", "tpa-v-1"] },
      { title: "Kesimpulan dan sikap penulis", lessons: ["Menarik simpulan", "Tujuan dan sikap penulis"] },
      { title: "Ejaan dan kalimat efektif", lessons: ["Kalimat efektif", "Penggunaan tanda baca"], quiz: ["tpa-v-2", "tpa-v-3"] },
    ],
  },
  {
    slug: "tes-wawasan-kebangsaan",
    title: "Tes Wawasan Kebangsaan",
    category: "cpns",
    subject: "Tes Wawasan Kebangsaan",
    level: "SEDANG",
    summary: "Pancasila, UUD 1945, NKRI, dan Bhinneka Tunggal Ika sesuai kisi-kisi SKD.",
    description:
      "Materi TWK disusun per aspek yang diuji. Setiap bab berisi ringkasan, pasal atau peristiwa penting, dan contoh soal studi kasus.",
    chapters: [
      { title: "Kisi-kisi TWK", lessons: ["Aspek yang diuji", "Cara mencapai nilai ambang batas"] },
      { title: "Pancasila", lessons: ["Sejarah perumusan", "Nilai dalam kehidupan sehari-hari"], quiz: ["skd-twk-1"] },
      { title: "UUD 1945 dan NKRI", lessons: ["Pasal yang sering ditanyakan", "Lembaga negara"], quiz: ["skd-twk-2", "skd-twk-4", "skd-twk-5"] },
      { title: "Bhinneka Tunggal Ika dan bahasa negara", lessons: ["Studi kasus keberagaman", "Kedudukan bahasa Indonesia"] },
    ],
  },
  {
    slug: "tes-intelegensia-umum",
    title: "Tes Intelegensia Umum",
    category: "cpns",
    subject: "Tes Intelegensia Umum",
    level: "SEDANG",
    summary: "Kemampuan verbal, numerik, dan figural untuk TIU dan TPA.",
    description:
      "TIU menguji kecepatan berpikir. Kelas ini melatih pola yang paling sering muncul: deret, analogi, dan soal cerita, beserta cara memeriksa jawaban dengan cepat.",
    chapters: [
      { title: "Kisi-kisi TIU", lessons: ["Verbal, numerik, figural", "Pembagian waktu"] },
      { title: "Kemampuan verbal", lessons: ["Sinonim dan antonim", "Analogi"], quiz: ["skd-tiu-2", "skd-tiu-3"] },
      { title: "Kemampuan numerik", lessons: ["Deret angka", "Soal cerita"], quiz: ["skd-tiu-1", "skd-tiu-4", "skd-tiu-5"] },
      { title: "Kemampuan figural", lessons: ["Analogi gambar", "Ketidaksamaan gambar"] },
    ],
  },
  {
    slug: "tes-karakteristik-pribadi",
    title: "Tes Karakteristik Pribadi",
    category: "cpns",
    subject: "Tes Karakteristik Pribadi",
    level: "MUDAH",
    summary: "Cara kerja penilaian TKP dan pola jawaban yang bernilai tinggi.",
    description:
      "TKP tidak punya jawaban salah, tetapi setiap pilihan bernilai 1 sampai 5. Kelas ini membahas sudut pandang yang dinilai: pelayanan publik, jejaring kerja, sosial budaya, teknologi informasi, dan profesionalisme.",
    chapters: [
      { title: "Cara kerja penilaian TKP", lessons: ["Skor 1 sampai 5", "Mengapa tidak ada jawaban salah"] },
      { title: "Pelayanan publik", lessons: ["Mendahulukan kepentingan masyarakat"] },
      { title: "Jejaring kerja dan sosial budaya", lessons: ["Kerja sama lintas unit", "Menghargai perbedaan"] },
      { title: "Teknologi informasi dan profesionalisme", lessons: ["Sikap terhadap perubahan", "Integritas"] },
    ],
  },
];

export interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  programType: "KELAS" | "TRYOUT" | "BUNDEL";
  educationLevel: "SMA" | "S1" | "UMUM";
  summary: string;
  description: string[];
  price: number;
  promoPrice: number | null;
  activeDays: number;
  salesCount: number;
  daysAgo: number;
  features: string[];
  courses: string[];
  exams: string[];
}

export const products: SeedProduct[] = [
  {
    slug: "persiapan-utbk-snbt",
    name: "Persiapan UTBK/SNBT 2027",
    category: "utbk-snbt",
    programType: "BUNDEL",
    educationLevel: "SMA",
    summary: "Tiga kelas inti UTBK dan tryout CBT dengan pembahasan per soal.",
    description: [
      "Paket ini disusun untuk belajar UTBK secara runtut selama satu semester. Materi dimulai dari mengenali jenis soal, lalu strategi per subtes.",
      "Setiap bab ditutup kuis singkat. Setelah kelas selesai, kerjakan tryout dengan timer seperti ujian sesungguhnya, lalu baca pembahasan untuk melihat topik yang masih lemah.",
    ],
    price: 499000,
    promoPrice: 349000,
    activeDays: 180,
    salesCount: 148,
    daysAgo: 83,
    features: [
      "Kelas Penalaran Umum, Pengetahuan Kuantitatif, dan Literasi Bahasa Indonesia",
      "Tryout UTBK dengan timer per subtes dan penilaian otomatis",
      "Pembahasan tertulis untuk setiap soal",
      "Analisis nilai per topik setelah tryout",
      "Sertifikat setelah semua materi kelas selesai",
    ],
    courses: ["penalaran-umum", "pengetahuan-kuantitatif", "literasi-bahasa-indonesia"],
    exams: ["tryout-utbk-paket-1"],
  },
  {
    slug: "tryout-utbk-snbt",
    name: "Tryout UTBK/SNBT",
    category: "utbk-snbt",
    programType: "TRYOUT",
    educationLevel: "SMA",
    summary: "Tryout UTBK dua subtes dengan peringkat peserta dan pembahasan.",
    description: [
      "Untuk siswa yang sudah belajar materi dan butuh latihan dalam kondisi ujian. Timer berjalan per subtes dan jawaban terkumpul otomatis saat waktu habis.",
      "Hasil menampilkan nilai per subtes, posisi di antara peserta lain, dan topik yang perlu diulang.",
    ],
    price: 149000,
    promoPrice: 99000,
    activeDays: 90,
    salesCount: 96,
    daysAgo: 44,
    features: ["Timer per subtes, jawaban tersimpan otomatis", "Peringkat dan persentil peserta", "Pembahasan setiap soal setelah selesai"],
    courses: [],
    exams: ["tryout-utbk-paket-1"],
  },
  {
    slug: "kelas-penalaran-umum",
    name: "Kelas Penalaran Umum",
    category: "utbk-snbt",
    programType: "KELAS",
    educationLevel: "SMA",
    summary: "Logika, penalaran analitik, dan kuantitatif dalam empat bab.",
    description: ["Kelas tunggal untuk siswa yang hanya perlu memperkuat penalaran. Setiap video membahas satu pola soal dan ditutup dengan latihan."],
    price: 179000,
    promoPrice: null,
    activeDays: 120,
    salesCount: 41,
    daysAgo: 96,
    features: ["Video per pola soal", "Kuis di akhir bab", "Catatan pribadi di setiap materi"],
    courses: ["penalaran-umum"],
    exams: [],
  },
  {
    slug: "persiapan-skd-cpns",
    name: "Persiapan SKD CPNS 2027",
    category: "cpns",
    programType: "BUNDEL",
    educationLevel: "UMUM",
    summary: "Kelas TWK, TIU, TKP dan tryout SKD dengan nilai ambang batas per subtes.",
    description: [
      "Paket lengkap untuk Seleksi Kompetensi Dasar. Tiga kelas mengikuti kisi-kisi TWK, TIU, dan TKP.",
      "Nilai ambang batas tiap subtes ditampilkan di hasil tryout, jadi Anda tahu subtes mana yang belum aman.",
    ],
    price: 449000,
    promoPrice: 299000,
    activeDays: 180,
    salesCount: 203,
    daysAgo: 70,
    features: [
      "Kelas TWK, TIU, dan TKP",
      "Tryout SKD dengan nilai ambang batas per subtes",
      "Soal dan opsi diacak per peserta",
      "Pembahasan tertulis setiap soal",
    ],
    courses: ["tes-wawasan-kebangsaan", "tes-intelegensia-umum", "tes-karakteristik-pribadi"],
    exams: ["tryout-skd-paket-1"],
  },
  {
    slug: "tryout-skd-cpns",
    name: "Tryout SKD CPNS",
    category: "cpns",
    programType: "TRYOUT",
    educationLevel: "UMUM",
    summary: "Tryout SKD TWK dan TIU dengan ambang batas dan peringkat.",
    description: ["Latihan SKD dalam format ujian. Cocok untuk pemanasan dua sampai empat minggu sebelum tes."],
    price: 79000,
    promoPrice: null,
    activeDays: 60,
    salesCount: 122,
    daysAgo: 29,
    features: ["Tryout SKD dua subtes", "Nilai ambang batas per subtes", "Pembahasan setelah selesai"],
    courses: [],
    exams: ["tryout-skd-paket-1"],
  },
  {
    slug: "kelas-tes-wawasan-kebangsaan",
    name: "Kelas Tes Wawasan Kebangsaan",
    category: "cpns",
    programType: "KELAS",
    educationLevel: "UMUM",
    summary: "Pancasila, UUD 1945, NKRI, dan Bhinneka Tunggal Ika.",
    description: ["Kelas tunggal TWK untuk pelamar yang sudah kuat di TIU dan TKP."],
    price: 149000,
    promoPrice: 119000,
    activeDays: 120,
    salesCount: 54,
    daysAgo: 80,
    features: ["Video TWK per aspek", "Kuis per bab"],
    courses: ["tes-wawasan-kebangsaan"],
    exams: [],
  },
  {
    slug: "persiapan-sekolah-kedinasan",
    name: "Persiapan Sekolah Kedinasan",
    category: "sekolah-kedinasan",
    programType: "BUNDEL",
    educationLevel: "SMA",
    summary: "SKD untuk sekolah kedinasan: kelas TWK, TIU, TKP dan tryout.",
    description: [
      "Disusun untuk lulusan SMA/SMK yang mendaftar sekolah kedinasan. Materi SKD sama dengan CPNS, dengan latihan menuju nilai ambang batas yang lebih tinggi.",
    ],
    price: 399000,
    promoPrice: 329000,
    activeDays: 150,
    salesCount: 18,
    daysAgo: 12,
    features: ["Kelas TWK, TIU, dan TKP", "Tryout SKD", "Pembahasan per soal"],
    courses: ["tes-wawasan-kebangsaan", "tes-intelegensia-umum", "tes-karakteristik-pribadi"],
    exams: ["tryout-skd-paket-1"],
  },
  {
    slug: "tes-potensi-akademik",
    name: "Tes Potensi Akademik Lengkap",
    category: "tes-potensi-akademik",
    programType: "BUNDEL",
    educationLevel: "S1",
    summary: "Kelas verbal dan numerik serta tryout TPA untuk seleksi S2.",
    description: ["Untuk calon mahasiswa pascasarjana dan pelamar beasiswa yang mensyaratkan skor TPA."],
    price: 259000,
    promoPrice: 199000,
    activeDays: 120,
    salesCount: 35,
    daysAgo: 57,
    features: ["Kelas Tes Intelegensia Umum", "Tryout TPA verbal dan numerik", "Soal essay yang dinilai admin"],
    courses: ["tes-intelegensia-umum"],
    exams: ["tryout-tpa-paket-1"],
  },
  {
    slug: "latihan-seleksi-mandiri-ptn",
    name: "Latihan Seleksi Mandiri PTN",
    category: "seleksi-mandiri",
    programType: "TRYOUT",
    educationLevel: "SMA",
    summary: "Tryout penalaran dan kuantitatif untuk persiapan jalur mandiri.",
    description: ["Latihan untuk jalur mandiri yang soalnya cenderung lebih panjang daripada UTBK."],
    price: 129000,
    promoPrice: null,
    activeDays: 90,
    salesCount: 9,
    daysAgo: 6,
    features: ["Tryout dua subtes", "Pembahasan per soal"],
    courses: [],
    exams: ["tryout-utbk-paket-1"],
  },
  {
    slug: "tes-rekrutmen-bumn",
    name: "Tes Rekrutmen BUMN",
    category: "tes-bumn",
    programType: "BUNDEL",
    educationLevel: "S1",
    summary: "Kelas wawasan kebangsaan dan kemampuan dasar dengan tryout.",
    description: ["Untuk lulusan D3/S1 yang mengikuti rekrutmen bersama BUMN."],
    price: 299000,
    promoPrice: 249000,
    activeDays: 120,
    salesCount: 22,
    daysAgo: 52,
    features: ["Kelas TWK dan TIU", "Tryout kemampuan dasar", "Pembahasan per soal"],
    courses: ["tes-wawasan-kebangsaan", "tes-intelegensia-umum"],
    exams: ["tryout-skd-paket-1"],
  },
  {
    slug: "kelas-literasi-bahasa-indonesia",
    name: "Kelas Literasi Bahasa Indonesia",
    category: "utbk-snbt",
    programType: "KELAS",
    educationLevel: "SMA",
    summary: "Membaca cepat, gagasan utama, dan simpulan.",
    description: ["Kelas untuk siswa yang sering kehabisan waktu di soal bacaan panjang."],
    price: 159000,
    promoPrice: null,
    activeDays: 120,
    salesCount: 27,
    daysAgo: 88,
    features: ["Latihan membaca dengan batas waktu", "Kuis per bab"],
    courses: ["literasi-bahasa-indonesia"],
    exams: [],
  },
  {
    slug: "latihan-tes-kompetensi",
    name: "Latihan Tes Kompetensi",
    category: "tes-kompetensi",
    programType: "TRYOUT",
    educationLevel: "S1",
    summary: "Tryout verbal dan numerik untuk seleksi kompetensi umum.",
    description: ["Program khusus untuk latihan seleksi kompetensi yang menguji kemampuan verbal dan numerik."],
    price: 99000,
    promoPrice: null,
    activeDays: 60,
    salesCount: 6,
    daysAgo: 4,
    features: ["Tryout dua subtes", "Pembahasan per soal"],
    courses: [],
    exams: ["tryout-tpa-paket-1"],
  },
];

export const productFaq = [
  { question: "Kapan masa aktif paket mulai dihitung?", answer: "Sejak pembayaran berhasil diverifikasi. Tanggal berakhirnya terlihat di dashboard pada bagian Program aktif." },
  { question: "Apakah bisa dicoba sebelum membeli?", answer: "Bisa. Bab 1 dan 2 setiap kelas terbuka gratis setelah Anda masuk. Bab berikutnya terbuka setelah paket dibeli." },
  { question: "Berapa kali tryout boleh diulang?", answer: "Tergantung pengaturan tiap tryout. Jumlahnya tertulis di halaman petunjuk sebelum mulai." },
  { question: "Apakah video bisa ditonton lewat ponsel?", answer: "Bisa, lewat peramban di ponsel, tablet, atau laptop. Posisi terakhir video tersimpan otomatis." },
];

export const testimonials = [
  {
    name: "Rani Oktaviani",
    program: "Persiapan UTBK/SNBT",
    opening: "Saya mulai belajar di bulan Agustus dengan nilai tryout pertama yang jauh dari target.",
    body: [
      "Yang paling terasa adalah bagian pembahasan. Setelah tryout, saya bisa melihat bahwa sebagian besar soal yang salah ada di penalaran analitik, bukan di matematika seperti dugaan saya.",
      "Saya ulang bab itu dua kali, lalu nilai di tryout berikutnya naik. Belum sempurna, tetapi sekarang saya tahu harus belajar apa.",
    ],
  },
  {
    name: "Bagus Pratama",
    program: "Persiapan SKD CPNS",
    opening: "Saya bekerja penuh waktu, jadi hanya bisa belajar malam hari sekitar satu jam.",
    body: [
      "Video yang pendek per topik membantu sekali. Saya bisa menyelesaikan satu materi lalu lanjut besok tanpa kehilangan posisi.",
      "Tryout-nya saya kerjakan setiap akhir pekan. Nilai TIU saya paling stabil, sedangkan TWK masih naik turun.",
    ],
  },
  {
    name: "Putri Anjani",
    program: "Tes Potensi Akademik",
    opening: "Saya butuh skor TPA untuk syarat beasiswa dan tidak punya banyak waktu.",
    body: [
      "Analisis hasil menunjukkan saya terlalu lama di soal numerik, jadi saya latih kecepatannya dulu.",
      "Skor akhirnya cukup untuk syarat pendaftaran.",
    ],
  },
];

export const homeFaq = [
  { question: "Apa bedanya kelas, video, dan tryout?", answer: "Kelas berisi materi berurutan per bab dengan video, PDF, dan kuis. Video belajar adalah pustaka video lepas per topik. Tryout adalah ujian berbasis komputer dengan timer dan penilaian otomatis." },
  { question: "Apakah ada materi gratis?", answer: "Ada. Setelah membuat akun, bab 1 dan 2 setiap kelas bisa dibuka tanpa membeli paket." },
  { question: "Bagaimana cara membayar?", answer: "Lewat virtual account, QRIS, e-wallet, atau transfer bank. Paket aktif otomatis setelah pembayaran terverifikasi." },
  { question: "Apakah tryout bisa dikerjakan ulang?", answer: "Bisa jika tryout tersebut mengizinkan lebih dari satu percobaan. Hasil setiap percobaan tersimpan dan bisa dibandingkan." },
  { question: "Kapan pembahasan bisa dilihat?", answer: "Setelah tryout dikumpulkan, kecuali admin mengatur waktu buka pembahasan tertentu, misalnya setelah jadwal tryout ditutup." },
  { question: "Apakah bisa belajar lewat ponsel?", answer: "Bisa. Seluruh halaman, termasuk tryout, dirancang untuk layar ponsel. Untuk tryout panjang kami sarankan laptop agar lebih nyaman." },
];

export const articles = [
  {
    slug: "cara-membagi-waktu-belajar-utbk",
    title: "Cara membagi waktu belajar UTBK dalam 12 minggu",
    category: "TIPS_BELAJAR" as const,
    excerpt: "Jadwal mingguan yang membagi waktu antara materi, latihan soal, dan tryout tanpa membuat lelah.",
    body: "<p>Dua belas minggu cukup untuk persiapan UTBK bila waktunya dibagi dengan jelas. Empat minggu pertama untuk materi, empat minggu berikutnya untuk latihan per subtes, dan empat minggu terakhir untuk tryout dan mengulang topik yang lemah.</p><h2>Minggu 1–4: materi</h2><p>Selesaikan satu bab per hari kerja. Akhiri setiap bab dengan kuis supaya tahu apakah perlu mengulang.</p><h2>Minggu 5–8: latihan per subtes</h2><p>Kerjakan 20 soal per hari dari satu subtes. Catat soal yang salah beserta alasannya.</p><h2>Minggu 9–12: tryout</h2><p>Satu tryout setiap akhir pekan. Gunakan analisis per topik untuk menentukan materi yang diulang pada hari kerja.</p>",
    daysAgo: 9,
  },
  {
    slug: "memahami-nilai-ambang-batas-skd",
    title: "Memahami nilai ambang batas SKD",
    category: "ARTIKEL" as const,
    excerpt: "Mengapa total nilai tinggi belum tentu lulus, dan bagaimana membaca hasil tryout per subtes.",
    body: "<p>Kelulusan SKD tidak hanya ditentukan total nilai. Setiap subtes punya nilai ambang batas sendiri. Peserta dengan total tinggi tetap tidak lulus bila salah satu subtesnya di bawah ambang batas.</p><h2>Membaca hasil tryout</h2><p>Di halaman hasil, lihat kolom ambang batas per subtes lebih dulu. Subtes yang belum lulus adalah prioritas belajar minggu berikutnya.</p>",
    daysAgo: 16,
  },
  {
    slug: "jadwal-pendaftaran-sekolah-kedinasan",
    title: "Hal yang perlu disiapkan sebelum pendaftaran sekolah kedinasan",
    category: "PENDAFTARAN" as const,
    excerpt: "Daftar dokumen dan persiapan yang biasanya diminta sebelum jadwal pendaftaran dibuka.",
    body: "<p>Jadwal resmi diumumkan oleh masing-masing instansi. Sebelum pendaftaran dibuka, siapkan dokumen berikut agar tidak terburu-buru.</p><ul><li>Pindaian ijazah atau surat keterangan lulus</li><li>Kartu identitas dan kartu keluarga</li><li>Pas foto terbaru sesuai ketentuan</li></ul><p>Pantau laman resmi instansi untuk tanggal pastinya.</p>",
    daysAgo: 3,
  },
];

export const vouchers = [
  { code: "HEMAT10", description: "Potongan 10% maksimal Rp50.000", discountType: "PERSEN" as const, value: 10, maxDiscount: 50000, minPurchase: 0, quota: 100, perUserLimit: 1 },
  { code: "BELAJAR25", description: "Potongan Rp25.000 untuk pembelian minimal Rp200.000", discountType: "NOMINAL" as const, value: 25000, maxDiscount: null, minPurchase: 200000, quota: 50, perUserLimit: 1 },
];
