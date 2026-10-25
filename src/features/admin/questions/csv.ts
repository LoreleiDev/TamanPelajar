import { OPTION_LABELS, questionSchema, type QuestionInput, type QuestionTypeCode } from "./schemas";

// Impor dan ekspor bank soal (M.5.2, M.5.3) sebagai fungsi murni. CSV mengikuti RFC 4180
// dengan pemisah koma atau titik koma (Excel berbahasa Indonesia memakai titik koma).

export const CSV_COLUMNS = [
  "kategori",
  "mata_pelajaran",
  "topik",
  "kesulitan",
  "jenis",
  "pertanyaan",
  "opsi_a",
  "opsi_b",
  "opsi_c",
  "opsi_d",
  "opsi_e",
  "kunci",
  "toleransi",
  "pembahasan",
  "bobot",
  "status",
] as const;

/** Urai teks CSV menjadi baris dan sel. Pemisah ditebak dari baris pertama. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const csvCell = (v: string) => (/[",;\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Baris ke teks CSV (pemisah koma, dengan BOM agar Excel membaca UTF-8). */
export function toCsv(rows: string[][]): string {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const TYPE_ALIASES: Record<string, QuestionTypeCode> = {
  pg_tunggal: "PG_TUNGGAL",
  pg: "PG_TUNGGAL",
  "pilihan ganda": "PG_TUNGGAL",
  pg_jamak: "PG_JAMAK",
  "pilihan ganda banyak": "PG_JAMAK",
  benar_salah: "BENAR_SALAH",
  "benar salah": "BENAR_SALAH",
  isian_singkat: "ISIAN_SINGKAT",
  isian: "ISIAN_SINGKAT",
  numerik: "NUMERIK",
  angka: "NUMERIK",
  essay: "ESSAY",
  esai: "ESSAY",
};

const DIFFICULTY: Record<string, "MUDAH" | "SEDANG" | "SULIT"> = { mudah: "MUDAH", sedang: "SEDANG", sulit: "SULIT" };
const STATUS: Record<string, "DRAF" | "TERBIT" | "ARSIP"> = { draf: "DRAF", terbit: "TERBIT", arsip: "ARSIP", "": "DRAF" };

export interface ImportRowError {
  row: number;
  message: string;
}

/**
 * Ubah baris CSV/XLSX (baris pertama = judul kolom) menjadi input soal yang tervalidasi.
 * Kunci: huruf opsi ("B"), beberapa huruf untuk PG jamak ("A,C"), teks untuk isian
 * (beberapa jawaban dipisah |), atau angka untuk numerik.
 */
export function rowsToQuestions(rows: string[][], categoryIdBySlug: Map<string, string>) {
  const errors: ImportRowError[] = [];
  const valid: { row: number; input: QuestionInput }[] = [];
  if (rows.length === 0) return { valid, errors: [{ row: 1, message: "File kosong" }] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = CSV_COLUMNS.filter((c) => !["opsi_c", "opsi_d", "opsi_e", "toleransi", "bobot", "status"].includes(c) && !header.includes(c));
  if (missing.length) return { valid, errors: [{ row: 1, message: `Kolom wajib tidak ada: ${missing.join(", ")}` }] };
  const col = (r: string[], name: (typeof CSV_COLUMNS)[number]) => (r[header.indexOf(name)] ?? "").trim();

  rows.slice(1).forEach((r, i) => {
    const rowNo = i + 2;
    const categoryId = categoryIdBySlug.get(col(r, "kategori").toLowerCase());
    if (!categoryId) return errors.push({ row: rowNo, message: `Kategori "${col(r, "kategori")}" tidak dikenal; pakai slug kategori, mis. utbk-snbt` });
    const type = TYPE_ALIASES[col(r, "jenis").toLowerCase()];
    if (!type) return errors.push({ row: rowNo, message: `Jenis "${col(r, "jenis")}" tidak dikenal` });
    const difficulty = DIFFICULTY[col(r, "kesulitan").toLowerCase()];
    if (!difficulty) return errors.push({ row: rowNo, message: "Kesulitan harus mudah, sedang, atau sulit" });
    const status = STATUS[col(r, "status").toLowerCase()];
    if (!status) return errors.push({ row: rowNo, message: "Status harus draf, terbit, atau arsip" });

    const key = col(r, "kunci");
    const isChoice = type === "PG_TUNGGAL" || type === "PG_JAMAK" || type === "BENAR_SALAH";
    let optionBodies = OPTION_LABELS.map((l) => col(r, `opsi_${l.toLowerCase()}` as (typeof CSV_COLUMNS)[number]));
    if (type === "BENAR_SALAH" && optionBodies.every((b) => b === "")) optionBodies = ["Benar", "Salah", "", "", ""];
    let correctLabels = new Set<string>();
    if (isChoice) {
      // Benar/salah boleh berkunci "benar"/"salah" selain huruf.
      const k = type === "BENAR_SALAH" && /^(benar|salah)$/i.test(key) ? (key.toLowerCase() === "benar" ? "A" : "B") : key;
      correctLabels = new Set(k.toUpperCase().split(/[,\s]+/).filter(Boolean));
      const bad = [...correctLabels].filter((l) => !OPTION_LABELS.includes(l as (typeof OPTION_LABELS)[number]));
      if (bad.length || correctLabels.size === 0) return errors.push({ row: rowNo, message: "Kunci pilihan ganda harus huruf opsi, mis. B atau A,C" });
    }

    const input: QuestionInput = {
      categoryId,
      subject: col(r, "mata_pelajaran"),
      topic: col(r, "topik"),
      difficulty,
      type,
      body: col(r, "pertanyaan"),
      explanation: col(r, "pembahasan"),
      explanationVideoUrl: "",
      imageId: null,
      correctText: type === "ISIAN_SINGKAT" ? key : "",
      correctNumber: type === "NUMERIK" ? key : "",
      tolerance: type === "NUMERIK" ? col(r, "toleransi") : "",
      weight: col(r, "bobot") || "1",
      status,
      options: isChoice ? OPTION_LABELS.map((l, j) => ({ body: optionBodies[j], isCorrect: correctLabels.has(l), score: "" })) : [],
    };
    const parsed = questionSchema.safeParse(input);
    if (!parsed.success) return errors.push({ row: rowNo, message: parsed.error.issues.map((x) => x.message).join("; ") });
    valid.push({ row: rowNo, input });
  });
  return { valid, errors };
}

export interface ExportQuestion {
  categorySlug: string;
  subject: string;
  topic: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  type: QuestionTypeCode;
  body: string;
  options: { label: string; body: string; isCorrect: boolean }[];
  correctText: string | null;
  correctNumber: number | null;
  tolerance: number | null;
  explanation: string;
  weight: number;
  status: "DRAF" | "TERBIT" | "ARSIP";
}

/** Soal ke baris ekspor dengan kolom yang sama seperti impor, sehingga bisa diimpor ulang. */
export function questionsToRows(questions: ExportQuestion[]): string[][] {
  const typeOut: Record<QuestionTypeCode, string> = {
    PG_TUNGGAL: "pg_tunggal",
    PG_JAMAK: "pg_jamak",
    BENAR_SALAH: "benar_salah",
    ISIAN_SINGKAT: "isian_singkat",
    NUMERIK: "numerik",
    ESSAY: "essay",
  };
  return [
    [...CSV_COLUMNS],
    ...questions.map((q) => {
      const opt = (l: string) => q.options.find((o) => o.label === l)?.body ?? "";
      const key =
        q.type === "ISIAN_SINGKAT"
          ? (q.correctText ?? "")
          : q.type === "NUMERIK"
            ? String(q.correctNumber ?? "")
            : q.options
                .filter((o) => o.isCorrect)
                .map((o) => o.label)
                .join(",");
      return [
        q.categorySlug,
        q.subject,
        q.topic,
        q.difficulty.toLowerCase(),
        typeOut[q.type],
        q.body,
        opt("A"),
        opt("B"),
        opt("C"),
        opt("D"),
        opt("E"),
        key,
        q.tolerance === null ? "" : String(q.tolerance),
        q.explanation,
        String(q.weight),
        q.status.toLowerCase(),
      ];
    }),
  ];
}
