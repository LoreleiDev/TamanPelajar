import { describe, expect, it } from "vitest";

import { CSV_COLUMNS, parseCsv, questionsToRows, rowsToQuestions, toCsv } from "./csv";
import { normalizeOptions, questionSchema } from "./schemas";

const cats = new Map([["utbk-snbt", "cat1"]]);
const header = CSV_COLUMNS.join(",");

describe("CSV bank soal", () => {
  it("mengurai kutip, koma di dalam sel, dan baris baru", () => {
    const rows = parseCsv('a,b,c\r\n"1, dua","ia berkata ""halo""","baris\nkedua"\r\n');
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1, dua", 'ia berkata "halo"', "baris\nkedua"],
    ]);
  });

  it("menebak pemisah titik koma dan membuang BOM", () => {
    expect(parseCsv("﻿x;y\n1;2")).toEqual([
      ["x", "y"],
      ["1", "2"],
    ]);
  });

  it("toCsv lalu parseCsv kembali sama", () => {
    const rows = [["a", 'b "c"', "d,e"], ["1", "2", "baris\nbaru"]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it("mengubah baris valid menjadi soal dan melaporkan baris salah", () => {
    const csv = [
      header,
      'utbk-snbt,Penalaran Umum,Logika,mudah,pg_tunggal,Soal satu?,A1,B1,C1,,,B,,Karena B.,1,terbit',
      "utbk-snbt,Penalaran Umum,Logika,sedang,pg_jamak,Soal dua?,A2,B2,C2,D2,,\"A,C\",,Karena A dan C.,2,draf",
      "utbk-snbt,Matematika,Aritmetika,sulit,numerik,Berapa 1/4?,,,,,,\"0,25\",0.01,Seperempat.,,",
      "utbk-snbt,Bahasa,Ejaan,mudah,benar_salah,Kata baku: apotek.,,,,,,benar,,Apotek baku.,,",
      "utbk-snbt,Bahasa,Ejaan,mudah,isian,Lawan kata tinggi?,,,,,,rendah|pendek,,Rendah.,,",
      "utbk-snbt,Bahasa,Esai,sulit,essay,Jelaskan pendapatmu.,,,,,,,,Rubrik.,,",
      "cpns,Bahasa,Ejaan,mudah,pg_tunggal,Soal?,A,B,,,,A,,P.,,",
      "utbk-snbt,Bahasa,Ejaan,mudah,pg_tunggal,Soal?,A,B,,,,F,,P.,,",
      "utbk-snbt,Bahasa,Ejaan,mudah,pg_tunggal,Soal?,A,,,,,A,,P.,,",
    ].join("\n");
    const { valid, errors } = rowsToQuestions(parseCsv(csv), cats);
    expect(valid.map((v) => v.input.type)).toEqual(["PG_TUNGGAL", "PG_JAMAK", "NUMERIK", "BENAR_SALAH", "ISIAN_SINGKAT", "ESSAY"]);
    expect(errors.map((e) => e.row)).toEqual([8, 9, 10]);
    expect(errors[0].message).toMatch(/Kategori "cpns"/);
    expect(errors[2].message).toMatch(/minimal dua opsi/);

    const numeric = questionSchema.parse(valid[2].input);
    expect(numeric.correctNumber).toBe(0.25);
    expect(numeric.tolerance).toBe(0.01);
    const tf = questionSchema.parse(valid[3].input);
    expect(normalizeOptions(tf).map((o) => [o.label, o.body, o.isCorrect])).toEqual([
      ["A", "Benar", true],
      ["B", "Salah", false],
    ]);
  });

  it("kolom wajib yang hilang dilaporkan di baris 1", () => {
    const { errors } = rowsToQuestions([["kategori", "pertanyaan"]], cats);
    expect(errors[0]).toMatchObject({ row: 1 });
    expect(errors[0].message).toMatch(/mata_pelajaran/);
  });

  it("ekspor bisa diimpor ulang", () => {
    const rows = questionsToRows([
      {
        categorySlug: "utbk-snbt",
        subject: "Penalaran Umum",
        topic: "Logika",
        difficulty: "SEDANG",
        type: "PG_JAMAK",
        body: "Pilih semua yang benar, ya?",
        options: [
          { label: "A", body: "Satu", isCorrect: true },
          { label: "B", body: "Dua", isCorrect: false },
          { label: "C", body: "Tiga", isCorrect: true },
        ],
        correctText: null,
        correctNumber: null,
        tolerance: null,
        explanation: "A dan C benar.",
        weight: 1.5,
        status: "TERBIT",
      },
    ]);
    const { valid, errors } = rowsToQuestions(parseCsv(toCsv(rows)), cats);
    expect(errors).toEqual([]);
    const q = questionSchema.parse(valid[0].input);
    expect(q.weight).toBe(1.5);
    expect(normalizeOptions(q).filter((o) => o.isCorrect).map((o) => o.label)).toEqual(["A", "C"]);
  });
});

describe("skema soal", () => {
  const base = {
    categoryId: "c",
    subject: "TKP",
    topic: "Pelayanan",
    difficulty: "SEDANG" as const,
    type: "PG_TUNGGAL" as const,
    body: "Sikap terbaik saat antrean panjang?",
    explanation: "Skor tertinggi untuk sikap melayani.",
    explanationVideoUrl: "",
    imageId: null,
    correctText: "",
    correctNumber: "",
    tolerance: "",
    weight: "1",
    status: "DRAF" as const,
  };

  it("opsi bergradasi: opsi berskor tertinggi ditandai benar", () => {
    const q = questionSchema.parse({
      ...base,
      options: [
        { body: "Abaikan", isCorrect: false, score: "1" },
        { body: "Bantu sesuai prosedur", isCorrect: false, score: "5" },
        { body: "Minta rekan", isCorrect: false, score: "3" },
      ],
    });
    expect(normalizeOptions(q).map((o) => [o.isCorrect, o.score])).toEqual([
      [false, 1],
      [true, 5],
      [false, 3],
    ]);
  });

  it("menolak PG tunggal dengan dua jawaban benar dan opsi yang melompat", () => {
    const r = questionSchema.safeParse({
      ...base,
      options: [
        { body: "A", isCorrect: true, score: "" },
        { body: "", isCorrect: false, score: "" },
        { body: "C", isCorrect: true, score: "" },
      ],
    });
    expect(r.success).toBe(false);
    const messages = r.success ? [] : r.error.issues.map((i) => i.message);
    expect(messages).toContain("Tandai tepat satu jawaban benar");
    expect(messages).toContain("Isi opsi berurutan dari A tanpa melompati huruf");
  });
});
