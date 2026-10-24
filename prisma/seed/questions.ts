// Bank soal demo (O.4–O.6): 3 tryout x 2 subtes x 5 soal. Semua soal dan pembahasan orisinal.

export type SeedQuestionType = "PG_TUNGGAL" | "PG_JAMAK" | "BENAR_SALAH" | "ISIAN_SINGKAT" | "NUMERIK" | "ESSAY";

export interface SeedQuestion {
  key: string;
  category: string;
  subject: string;
  topic: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  type: SeedQuestionType;
  body: string;
  /** Untuk pilihan ganda: teks opsi; tanda "*" di awal menandai jawaban benar. */
  options?: string[];
  correctText?: string;
  correctNumber?: number;
  tolerance?: number;
  explanation: string;
}

const tf = (correct: boolean) => (correct ? ["*Benar", "Salah"] : ["Benar", "*Salah"]);

export const questions: SeedQuestion[] = [
  // ─── UTBK: Penalaran Umum ───
  {
    key: "utbk-pu-1",
    category: "utbk-snbt",
    subject: "Penalaran Umum",
    topic: "Logika",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Semua peserta yang lulus tes tertulis mengikuti wawancara. Rani tidak mengikuti wawancara. Simpulan yang pasti benar adalah …",
    options: [
      "Rani lulus tes tertulis",
      "*Rani tidak lulus tes tertulis",
      "Rani tidak mendaftar",
      "Rani mungkin lulus tes tertulis",
      "Tidak dapat disimpulkan",
    ],
    explanation:
      "Pernyataannya berbentuk jika p maka q: jika lulus tes tertulis, maka ikut wawancara. Kontraposisinya, jika tidak ikut wawancara, maka tidak lulus tes tertulis. Karena Rani tidak ikut wawancara, Rani pasti tidak lulus tes tertulis.",
  },
  {
    key: "utbk-pu-2",
    category: "utbk-snbt",
    subject: "Penalaran Umum",
    topic: "Logika",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Semua atlet sekolah rajin berlatih pagi. Sebagian siswa kelas XII adalah atlet sekolah. Simpulan yang tepat adalah …",
    options: [
      "Semua siswa kelas XII rajin berlatih pagi",
      "*Sebagian siswa kelas XII rajin berlatih pagi",
      "Semua yang rajin berlatih pagi adalah atlet",
      "Tidak ada siswa kelas XII yang berlatih pagi",
      "Sebagian atlet sekolah bukan siswa",
    ],
    explanation:
      "Siswa kelas XII yang menjadi atlet termasuk kelompok yang rajin berlatih pagi. Jadi paling tidak sebagian siswa kelas XII rajin berlatih pagi. Kita tidak tahu apa pun tentang siswa kelas XII yang bukan atlet.",
  },
  {
    key: "utbk-pu-3",
    category: "utbk-snbt",
    subject: "Penalaran Umum",
    topic: "Penalaran Analitik",
    difficulty: "SEDANG",
    type: "PG_TUNGGAL",
    body: "Lima siswa P, Q, R, S, dan T presentasi pada Senin sampai Jumat, satu orang per hari. Q presentasi sebelum R. S presentasi hari Rabu. T tidak presentasi hari Senin maupun Jumat. P presentasi tepat sehari setelah T. Siapa yang presentasi hari Jumat?",
    options: ["*P", "Q", "R", "S", "T"],
    explanation:
      "S di hari Rabu. T hanya bisa Selasa atau Kamis. Jika T Selasa, P harus Rabu, padahal Rabu milik S. Jadi T Kamis dan P Jumat. Q dan R mengisi Senin dan Selasa dengan Q lebih dulu.",
  },
  {
    key: "utbk-pu-4",
    category: "utbk-snbt",
    subject: "Penalaran Umum",
    topic: "Logika",
    difficulty: "SEDANG",
    type: "BENAR_SALAH",
    body: "Pernyataan “Tidak semua peserta tryout lulus” setara dengan “Ada peserta tryout yang tidak lulus”.",
    options: tf(true),
    explanation:
      "Ingkaran dari “semua lulus” adalah “ada yang tidak lulus”. “Tidak semua lulus” adalah ingkaran itu sendiri, jadi kedua kalimat setara.",
  },
  {
    key: "utbk-pu-5",
    category: "utbk-snbt",
    subject: "Penalaran Umum",
    topic: "Penalaran Kuantitatif",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Harga 3 buku dan 2 pena Rp34.000. Harga 1 buku dan 2 pena Rp18.000. Berapa harga 1 buku?",
    options: ["Rp6.000", "Rp7.000", "*Rp8.000", "Rp9.000", "Rp10.000"],
    explanation: "Kurangkan kedua persamaan: (3 buku + 2 pena) − (1 buku + 2 pena) = 2 buku = Rp16.000. Jadi 1 buku Rp8.000.",
  },
  // ─── UTBK: Pengetahuan Kuantitatif ───
  {
    key: "utbk-pk-1",
    category: "utbk-snbt",
    subject: "Pengetahuan Kuantitatif",
    topic: "Statistika",
    difficulty: "SEDANG",
    type: "NUMERIK",
    body: "Rata-rata nilai 4 siswa adalah 75. Setelah satu siswa baru bergabung, rata-ratanya menjadi 78. Berapa nilai siswa baru tersebut?",
    correctNumber: 90,
    tolerance: 0,
    explanation: "Jumlah nilai awal 4 × 75 = 300. Jumlah setelah bergabung 5 × 78 = 390. Nilai siswa baru 390 − 300 = 90.",
  },
  {
    key: "utbk-pk-2",
    category: "utbk-snbt",
    subject: "Pengetahuan Kuantitatif",
    topic: "Aljabar",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Jika 2x − 5 = 3x + 4, nilai x adalah …",
    options: ["*−9", "−3", "−1", "1", "9"],
    explanation: "Pindahkan suku x ke satu sisi: 2x − 3x = 4 + 5, sehingga −x = 9 dan x = −9.",
  },
  {
    key: "utbk-pk-3",
    category: "utbk-snbt",
    subject: "Pengetahuan Kuantitatif",
    topic: "Bilangan",
    difficulty: "MUDAH",
    type: "PG_JAMAK",
    body: "Pilih semua bilangan prima di antara bilangan berikut.",
    options: ["21", "*23", "27", "*29", "*31"],
    explanation: "21 = 3 × 7 dan 27 = 3 × 9, jadi keduanya bukan prima. 23, 29, dan 31 hanya habis dibagi 1 dan dirinya sendiri.",
  },
  {
    key: "utbk-pk-4",
    category: "utbk-snbt",
    subject: "Pengetahuan Kuantitatif",
    topic: "Geometri",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Sebuah segitiga siku-siku memiliki sisi tegak 6 cm dan 8 cm. Panjang sisi miringnya adalah …",
    options: ["7 cm", "9 cm", "*10 cm", "12 cm", "14 cm"],
    explanation: "Dengan teorema Pythagoras, sisi miring = √(6² + 8²) = √(36 + 64) = √100 = 10 cm.",
  },
  {
    key: "utbk-pk-5",
    category: "utbk-snbt",
    subject: "Pengetahuan Kuantitatif",
    topic: "Statistika",
    difficulty: "SEDANG",
    type: "PG_TUNGGAL",
    body: "Dua dadu dilempar bersamaan. Peluang jumlah mata dadu sama dengan 7 adalah …",
    options: ["*1/6", "1/12", "5/36", "7/36", "1/4"],
    explanation:
      "Pasangan yang berjumlah 7 ada 6: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). Total kemungkinan 36, jadi peluangnya 6/36 = 1/6.",
  },
  // ─── SKD: TWK ───
  {
    key: "skd-twk-1",
    category: "cpns",
    subject: "Tes Wawasan Kebangsaan",
    topic: "Pancasila",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Tindakan yang paling mencerminkan sila keempat Pancasila adalah …",
    options: [
      "Menggalang donasi untuk korban banjir",
      "Mengikuti upacara hari kemerdekaan",
      "*Bermusyawarah menyusun jadwal piket dengan mendengar semua usulan",
      "Menghormati teman yang beribadah",
      "Membeli produk dalam negeri",
    ],
    explanation:
      "Sila keempat menekankan musyawarah untuk mufakat. Pilihan lain lebih dekat dengan sila kedua (donasi), ketiga (upacara, produk dalam negeri), dan pertama (menghormati ibadah).",
  },
  {
    key: "skd-twk-2",
    category: "cpns",
    subject: "Tes Wawasan Kebangsaan",
    topic: "UUD 1945",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Menurut UUD 1945, lembaga yang berwenang mengubah dan menetapkan undang-undang dasar adalah …",
    options: ["*MPR", "DPR", "DPD", "Presiden", "Mahkamah Konstitusi"],
    explanation: "Pasal 3 ayat (1) UUD 1945 menyebutkan MPR berwenang mengubah dan menetapkan undang-undang dasar.",
  },
  {
    key: "skd-twk-3",
    category: "cpns",
    subject: "Tes Wawasan Kebangsaan",
    topic: "Bhinneka Tunggal Ika",
    difficulty: "SEDANG",
    type: "PG_TUNGGAL",
    body: "Semboyan Bhinneka Tunggal Ika berasal dari kitab …",
    options: ["Negarakertagama", "*Sutasoma", "Pararaton", "Arjunawiwaha", "Bharatayuddha"],
    explanation: "Semboyan ini diambil dari kitab Sutasoma karya Mpu Tantular pada masa Majapahit.",
  },
  {
    key: "skd-twk-4",
    category: "cpns",
    subject: "Tes Wawasan Kebangsaan",
    topic: "UUD 1945",
    difficulty: "SEDANG",
    type: "BENAR_SALAH",
    body: "Bahasa Indonesia ditetapkan sebagai bahasa negara dalam Pasal 36 UUD 1945.",
    options: tf(true),
    explanation: "Pasal 36 UUD 1945 berbunyi: Bahasa Negara ialah Bahasa Indonesia.",
  },
  {
    key: "skd-twk-5",
    category: "cpns",
    subject: "Tes Wawasan Kebangsaan",
    topic: "NKRI",
    difficulty: "SULIT",
    type: "PG_TUNGGAL",
    body: "Deklarasi Djuanda tahun 1957 penting bagi NKRI karena …",
    options: [
      "Menetapkan ibu kota negara",
      "*Menyatakan laut di antara pulau-pulau sebagai bagian wilayah Indonesia",
      "Mengakhiri sistem pemerintahan parlementer",
      "Membentuk provinsi-provinsi pertama",
      "Menetapkan lagu kebangsaan",
    ],
    explanation:
      "Deklarasi Djuanda menyatakan perairan di antara dan di sekitar pulau-pulau Indonesia sebagai satu kesatuan wilayah, dasar konsep negara kepulauan.",
  },
  // ─── SKD: TIU ───
  {
    key: "skd-tiu-1",
    category: "cpns",
    subject: "Tes Intelegensia Umum",
    topic: "Deret",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Lanjutkan deret berikut: 3, 6, 11, 18, 27, …",
    options: ["36", "*38", "39", "40", "42"],
    explanation: "Selisih antarsuku bertambah 2: 3, 5, 7, 9, lalu 11. Jadi suku berikutnya 27 + 11 = 38.",
  },
  {
    key: "skd-tiu-2",
    category: "cpns",
    subject: "Tes Intelegensia Umum",
    topic: "Analogi",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "DOKTER : STETOSKOP = … : …",
    options: ["Petani : sawah", "*Fotografer : kamera", "Guru : murid", "Penulis : buku", "Pilot : bandara"],
    explanation:
      "Stetoskop adalah alat kerja dokter. Pasangan yang sama hubungannya adalah fotografer dan kamera. Sawah dan bandara adalah tempat, murid adalah orang, buku adalah hasil karya.",
  },
  {
    key: "skd-tiu-3",
    category: "cpns",
    subject: "Tes Intelegensia Umum",
    topic: "Sinonim dan Antonim",
    difficulty: "SEDANG",
    type: "ISIAN_SINGKAT",
    body: "Tulis lawan kata (antonim) dari “eksplisit”.",
    correctText: "implisit|tersirat",
    explanation: "Eksplisit berarti tersurat atau dinyatakan terang-terangan. Lawannya implisit, yaitu tersirat.",
  },
  {
    key: "skd-tiu-4",
    category: "cpns",
    subject: "Tes Intelegensia Umum",
    topic: "Soal Cerita",
    difficulty: "SEDANG",
    type: "PG_TUNGGAL",
    body: "Sebuah pekerjaan selesai dalam 12 hari oleh 6 orang. Jika dikerjakan 8 orang dengan kecepatan kerja yang sama, pekerjaan itu selesai dalam … hari.",
    options: ["6", "8", "*9", "10", "16"],
    explanation: "Beban kerja 12 × 6 = 72 hari-orang. Dengan 8 orang: 72 ÷ 8 = 9 hari.",
  },
  {
    key: "skd-tiu-5",
    category: "cpns",
    subject: "Tes Intelegensia Umum",
    topic: "Soal Cerita",
    difficulty: "SULIT",
    type: "NUMERIK",
    body: "Harga sebuah barang Rp50.000 naik 20%, lalu turun 20% dari harga barunya. Berapa harga akhirnya dalam rupiah? Tulis angkanya saja.",
    correctNumber: 48000,
    tolerance: 0,
    explanation: "Setelah naik 20%: 50.000 × 1,2 = 60.000. Setelah turun 20%: 60.000 × 0,8 = 48.000. Naik lalu turun dengan persen yang sama tidak kembali ke harga awal.",
  },
  // ─── TPA: Verbal ───
  {
    key: "tpa-v-1",
    category: "tes-potensi-akademik",
    subject: "Verbal",
    topic: "Sinonim",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Sinonim kata “akurat” adalah …",
    options: ["Cepat", "*Tepat", "Rapi", "Lengkap", "Ringkas"],
    explanation: "Akurat berarti teliti dan tepat, tanpa kesalahan.",
  },
  {
    key: "tpa-v-2",
    category: "tes-potensi-akademik",
    subject: "Verbal",
    topic: "Sinonim",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Sinonim kata “kendala” adalah …",
    options: ["Kendaraan", "*Hambatan", "Tujuan", "Bantuan", "Kebiasaan"],
    explanation: "Kendala berarti halangan atau hambatan.",
  },
  {
    key: "tpa-v-3",
    category: "tes-potensi-akademik",
    subject: "Verbal",
    topic: "Analogi Verbal",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "AIR : HAUS = MAKANAN : …",
    options: ["Kenyang", "*Lapar", "Dapur", "Piring", "Garam"],
    explanation: "Air menghilangkan haus; makanan menghilangkan lapar.",
  },
  {
    key: "tpa-v-4",
    category: "tes-potensi-akademik",
    subject: "Verbal",
    topic: "Pemahaman Bacaan",
    difficulty: "SEDANG",
    type: "PG_TUNGGAL",
    body: "Membaca 20 menit setiap hari lebih berpengaruh terhadap kemampuan memahami bacaan daripada membaca tiga jam sekali seminggu. Kosakata baru lebih mudah diingat bila sering dijumpai dalam jarak waktu yang pendek.\n\nGagasan utama paragraf tersebut adalah …",
    options: [
      "Membaca tiga jam seminggu tidak bermanfaat",
      "*Membaca rutin dalam waktu singkat lebih efektif daripada membaca lama tetapi jarang",
      "Kosakata baru sulit diingat",
      "Membaca sebaiknya dilakukan pagi hari",
      "Kemampuan membaca ditentukan bakat",
    ],
    explanation:
      "Kalimat pertama adalah gagasan utama, sedangkan kalimat kedua menjelaskan alasannya. Pilihan A terlalu mutlak; paragraf hanya membandingkan, tidak menyebut membaca seminggu sekali tanpa manfaat.",
  },
  {
    key: "tpa-v-5",
    category: "tes-potensi-akademik",
    subject: "Verbal",
    topic: "Pemahaman Bacaan",
    difficulty: "SULIT",
    type: "ESSAY",
    body: "Dalam 3–5 kalimat, jelaskan mengapa jadwal belajar rutin lebih efektif daripada belajar mendadak menjelang ujian. Sertakan satu contoh dari pengalamanmu.",
    explanation:
      "Jawaban yang baik menyebut: pengulangan berjarak membantu daya ingat jangka panjang; beban belajar terbagi sehingga tidak kelelahan; ada waktu menemukan bagian yang belum dipahami. Contoh pribadi harus relevan.",
  },
  // ─── TPA: Numerik ───
  {
    key: "tpa-n-1",
    category: "tes-potensi-akademik",
    subject: "Numerik",
    topic: "Deret",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "Lanjutkan deret berikut: 2, 6, 18, 54, …",
    options: ["108", "126", "*162", "180", "216"],
    explanation: "Setiap suku dikali 3. Jadi 54 × 3 = 162.",
  },
  {
    key: "tpa-n-2",
    category: "tes-potensi-akademik",
    subject: "Numerik",
    topic: "Aritmetika",
    difficulty: "MUDAH",
    type: "PG_TUNGGAL",
    body: "15% dari 240 adalah …",
    options: ["24", "30", "*36", "40", "48"],
    explanation: "10% dari 240 = 24, dan 5% = 12. Jadi 15% = 24 + 12 = 36.",
  },
  {
    key: "tpa-n-3",
    category: "tes-potensi-akademik",
    subject: "Numerik",
    topic: "Perbandingan",
    difficulty: "SEDANG",
    type: "PG_TUNGGAL",
    body: "Perbandingan uang Ani dan Budi 3 : 5. Selisih uang mereka Rp40.000. Berapa uang Budi?",
    options: ["Rp60.000", "Rp80.000", "*Rp100.000", "Rp120.000", "Rp160.000"],
    explanation: "Selisih 5 − 3 = 2 bagian = Rp40.000, jadi 1 bagian = Rp20.000. Uang Budi 5 × Rp20.000 = Rp100.000.",
  },
  {
    key: "tpa-n-4",
    category: "tes-potensi-akademik",
    subject: "Numerik",
    topic: "Aritmetika",
    difficulty: "SEDANG",
    type: "NUMERIK",
    body: "Sebuah mobil melaju 60 km/jam. Berapa jam waktu yang dibutuhkan untuk menempuh 150 km? Gunakan koma untuk desimal.",
    correctNumber: 2.5,
    tolerance: 0,
    explanation: "Waktu = jarak ÷ kecepatan = 150 ÷ 60 = 2,5 jam.",
  },
  {
    key: "tpa-n-5",
    category: "tes-potensi-akademik",
    subject: "Numerik",
    topic: "Aritmetika",
    difficulty: "MUDAH",
    type: "BENAR_SALAH",
    body: "Bilangan desimal 0,25 sama dengan pecahan 1/4.",
    options: tf(true),
    explanation: "1 ÷ 4 = 0,25.",
  },
];

export interface SeedExam {
  slug: string;
  title: string;
  category: string;
  description: string;
  rules: string;
  correctScore: number;
  wrongScore: number;
  passingGrade: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  sections: { title: string; durationMin: number; weight: number; passingGrade: number | null; questionKeys: string[] }[];
}

const keys = (prefix: string) => [1, 2, 3, 4, 5].map((n) => `${prefix}-${n}`);

export const exams: SeedExam[] = [
  {
    slug: "tryout-utbk-paket-1",
    title: "Tryout UTBK Paket 1",
    category: "utbk-snbt",
    description: "Latihan dua subtes UTBK: Penalaran Umum dan Pengetahuan Kuantitatif, masing-masing 5 soal dengan timer sendiri.",
    rules:
      "Kerjakan subtes secara berurutan. Waktu tiap subtes dihitung terpisah. Jawaban tersimpan otomatis. Jawaban benar bernilai 4, salah dan kosong bernilai 0.",
    correctScore: 4,
    wrongScore: 0,
    passingGrade: 24,
    maxAttempts: 2,
    shuffleQuestions: false,
    shuffleOptions: true,
    sections: [
      { title: "Penalaran Umum", durationMin: 15, weight: 1, passingGrade: null, questionKeys: keys("utbk-pu") },
      { title: "Pengetahuan Kuantitatif", durationMin: 15, weight: 1, passingGrade: null, questionKeys: keys("utbk-pk") },
    ],
  },
  {
    slug: "tryout-skd-paket-1",
    title: "Tryout SKD Paket 1",
    category: "cpns",
    description: "Latihan SKD subtes TWK dan TIU dengan nilai ambang batas per subtes, masing-masing 5 soal.",
    rules:
      "Jawaban benar bernilai 5, salah dan kosong 0. Untuk lulus, nilai setiap subtes harus mencapai ambang batas dan total minimal 30. Soal diacak per peserta.",
    correctScore: 5,
    wrongScore: 0,
    passingGrade: 30,
    maxAttempts: 2,
    shuffleQuestions: true,
    shuffleOptions: true,
    sections: [
      { title: "TWK", durationMin: 20, weight: 1, passingGrade: 15, questionKeys: keys("skd-twk") },
      { title: "TIU", durationMin: 20, weight: 1, passingGrade: 15, questionKeys: keys("skd-tiu") },
    ],
  },
  {
    slug: "tryout-tpa-paket-1",
    title: "Tryout TPA Paket 1",
    category: "tes-potensi-akademik",
    description: "Latihan Tes Potensi Akademik subtes Verbal dan Numerik, termasuk satu soal essay yang dinilai admin.",
    rules:
      "Jawaban benar bernilai 10, salah dikurangi 2, kosong 0. Soal essay dinilai admin setelah tryout selesai sehingga nilai akhir bisa berubah.",
    correctScore: 10,
    wrongScore: -2,
    passingGrade: 60,
    maxAttempts: 3,
    shuffleQuestions: false,
    shuffleOptions: false,
    sections: [
      { title: "Verbal", durationMin: 25, weight: 1, passingGrade: null, questionKeys: keys("tpa-v") },
      { title: "Numerik", durationMin: 25, weight: 1, passingGrade: null, questionKeys: keys("tpa-n") },
    ],
  },
];
