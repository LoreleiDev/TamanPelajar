import { describe, expect, it } from "vitest";

import { scoreExam, type ScoringConfig, type ScoringQuestion } from "./score";

const pg = (id: string, sectionId: string, correct: string, extra: Partial<ScoringQuestion> = {}): ScoringQuestion => ({
  id,
  sectionId,
  type: "PG_TUNGGAL",
  topic: "Umum",
  difficulty: "SEDANG",
  weight: 1,
  options: ["a", "b", "c"].map((o) => ({ id: `${id}-${o}`, isCorrect: o === correct, score: null })),
  correctText: null,
  correctNumber: null,
  tolerance: null,
  ...extra,
});

const config = (over: Partial<ScoringConfig> = {}): ScoringConfig => ({
  correctScore: 4,
  wrongScore: -1,
  passingGrade: 0,
  sections: [{ id: "s1", weight: 1, passingGrade: null }],
  ...over,
});

describe("scoreExam", () => {
  it("benar mendapat skor, salah bisa negatif, kosong bernilai nol (J.1.1–J.1.3)", () => {
    const qs = [pg("q1", "s1", "a"), pg("q2", "s1", "a"), pg("q3", "s1", "a")];
    const r = scoreExam(qs, { q1: { optionIds: ["q1-a"] }, q2: { optionIds: ["q2-b"] } }, config());
    expect(r.questions.map((q) => q.status)).toEqual(["BENAR", "SALAH", "KOSONG"]);
    expect(r.totalScore).toBe(3);
    expect(r.maxScore).toBe(12);
    expect([r.correct, r.wrong, r.empty]).toEqual([1, 1, 1]);
  });

  it("bobot soal dan bobot subtes dikalikan (J.1.4–J.1.5)", () => {
    const qs = [pg("q1", "s1", "a", { weight: 2 }), pg("q2", "s2", "a")];
    const r = scoreExam(
      qs,
      { q1: { optionIds: ["q1-a"] }, q2: { optionIds: ["q2-a"] } },
      config({
        wrongScore: 0,
        sections: [
          { id: "s1", weight: 1, passingGrade: null },
          { id: "s2", weight: 1.5, passingGrade: null },
        ],
      }),
    );
    expect(r.sections.map((s) => s.score)).toEqual([8, 6]);
    expect(r.totalScore).toBe(14);
  });

  it("lulus hanya bila total dan setiap subtes memenuhi passing grade (J.1.6)", () => {
    const qs = [pg("q1", "s1", "a"), pg("q2", "s2", "a")];
    const cfg = config({
      wrongScore: 0,
      passingGrade: 4,
      sections: [
        { id: "s1", weight: 1, passingGrade: 4 },
        { id: "s2", weight: 1, passingGrade: 4 },
      ],
    });
    expect(scoreExam(qs, { q1: { optionIds: ["q1-a"] }, q2: { optionIds: ["q2-b"] } }, cfg).passed).toBe(false);
    expect(scoreExam(qs, { q1: { optionIds: ["q1-a"] }, q2: { optionIds: ["q2-a"] } }, cfg).passed).toBe(true);
  });

  it("pilihan jamak harus tepat semua, isian tidak peka huruf dan spasi, numerik dengan toleransi", () => {
    const jamak: ScoringQuestion = {
      ...pg("j", "s1", "a"),
      type: "PG_JAMAK",
      options: [
        { id: "j-a", isCorrect: true, score: null },
        { id: "j-b", isCorrect: true, score: null },
        { id: "j-c", isCorrect: false, score: null },
      ],
    };
    const isian: ScoringQuestion = { ...pg("i", "s1", "a"), type: "ISIAN_SINGKAT", options: [], correctText: "Fotosintesis|foto sintesis" };
    const angka: ScoringQuestion = { ...pg("n", "s1", "a"), type: "NUMERIK", options: [], correctNumber: 12.5, tolerance: 0.1 };
    const r = scoreExam(
      [jamak, isian, angka],
      { j: { optionIds: ["j-a"] }, i: { textAnswer: "  FOTO   sintesis " }, n: { numberAnswer: 12.58 } },
      config({ wrongScore: 0 }),
    );
    expect(r.questions.map((q) => q.status)).toEqual(["SALAH", "BENAR", "BENAR"]);
  });

  it("opsi bergradasi (TKP) memakai skor opsi, essay menunggu penilaian", () => {
    const tkp: ScoringQuestion = {
      ...pg("t", "s1", "a"),
      options: [1, 3, 5].map((s, i) => ({ id: `t-${i}`, isCorrect: s === 5, score: s })),
    };
    const essay: ScoringQuestion = { ...pg("e", "s1", "a"), type: "ESSAY", options: [] };
    const r = scoreExam([tkp, essay], { t: { optionIds: ["t-1"] }, e: { textAnswer: "jawaban" } }, config());
    expect(r.questions[0]).toMatchObject({ status: "SALAH", score: 3, maxScore: 5 });
    expect(r.questions[1].status).toBe("MENUNGGU_PENILAIAN");
    expect(r.pending).toBe(1);
  });

  it("analisis per topik menghitung penguasaan dan rata-rata waktu (J.2.1–J.2.3)", () => {
    const qs = [pg("q1", "s1", "a", { topic: "Deret" }), pg("q2", "s1", "a", { topic: "Deret" })];
    const r = scoreExam(qs, { q1: { optionIds: ["q1-a"], timeSpentSec: 30 }, q2: { optionIds: ["q2-c"], timeSpentSec: 50 } }, config());
    expect(r.topics).toEqual([{ topic: "Deret", correct: 1, total: 2, mastery: 50, avgTimeSec: 40 }]);
  });
});
