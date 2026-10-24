// Soal contoh untuk kartu CBT di hero beranda. Soal orisinal; kunci dan pembahasan boleh
// dikirim ke client karena ini latihan terbuka, bukan bagian dari tryout yang dinilai.

export interface SampleQuestion {
  id: string;
  exam: string;
  section: string;
  number: number;
  total: number;
  remaining: string;
  prompt: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
}

export const sampleQuestions: SampleQuestion[] = [
  {
    id: "contoh-tiu",
    exam: "Tryout SKD Paket 1",
    section: "TIU",
    number: 12,
    total: 110,
    remaining: "84:37",
    prompt: "Lanjutkan deret berikut: 3, 6, 11, 18, 27, …",
    options: [
      { label: "A", text: "36" },
      { label: "B", text: "38" },
      { label: "C", text: "39" },
      { label: "D", text: "40" },
      { label: "E", text: "42" },
    ],
    answer: "B",
    explanation: "Selisih antarsuku bertambah 2: 3, 5, 7, 9, lalu 11. Jadi suku berikutnya 27 + 11 = 38.",
  },
  {
    id: "contoh-pu",
    exam: "Tryout UTBK Paket 1",
    section: "Penalaran Umum",
    number: 5,
    total: 20,
    remaining: "41:10",
    prompt:
      "Semua peserta yang lulus tes tertulis mengikuti wawancara. Rani tidak mengikuti wawancara. Simpulan yang pasti benar adalah …",
    options: [
      { label: "A", text: "Rani lulus tes tertulis" },
      { label: "B", text: "Rani tidak lulus tes tertulis" },
      { label: "C", text: "Rani tidak mendaftar" },
      { label: "D", text: "Rani mungkin lulus tes tertulis" },
      { label: "E", text: "Tidak dapat disimpulkan" },
    ],
    answer: "B",
    explanation:
      "Pernyataannya: jika lulus tes tertulis, maka ikut wawancara. Kontraposisinya: jika tidak ikut wawancara, maka tidak lulus tes tertulis.",
  },
  {
    id: "contoh-twk",
    exam: "Tryout SKD Paket 1",
    section: "TWK",
    number: 7,
    total: 110,
    remaining: "92:05",
    prompt: "Tindakan yang paling mencerminkan sila keempat Pancasila adalah …",
    options: [
      { label: "A", text: "Menggalang donasi untuk korban banjir" },
      { label: "B", text: "Mengikuti upacara hari kemerdekaan" },
      { label: "C", text: "Bermusyawarah menyusun jadwal piket dengan mendengar semua usulan" },
      { label: "D", text: "Menghormati teman yang beribadah" },
      { label: "E", text: "Membeli produk dalam negeri" },
    ],
    answer: "C",
    explanation:
      "Sila keempat menekankan musyawarah untuk mufakat. Pilihan lain lebih dekat dengan sila kedua, ketiga, dan pertama.",
  },
];
