// Penilaian tryout (J.1) sebagai fungsi murni. Dipakai server saat submit dan oleh seed.
// Tidak ada akses database di sini agar mudah diuji unit.

export type QuestionType = "PG_TUNGGAL" | "PG_JAMAK" | "BENAR_SALAH" | "ISIAN_SINGKAT" | "NUMERIK" | "ESSAY";

export interface ScoringOption {
  id: string;
  isCorrect: boolean;
  /** Skor bergradasi (mis. TKP 1–5). Bila ada, menggantikan skor benar/salah. */
  score: number | null;
}

export interface ScoringQuestion {
  id: string;
  sectionId: string;
  type: QuestionType;
  topic: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  /** Bobot soal (J.1.4); sudah termasuk bobot khusus di tryout bila ada. */
  weight: number;
  options: ScoringOption[];
  /** Isian singkat: beberapa jawaban benar dipisah "|". */
  correctText: string | null;
  correctNumber: number | null;
  tolerance: number | null;
}

export interface ScoringAnswer {
  optionIds?: string[] | null;
  textAnswer?: string | null;
  numberAnswer?: number | null;
  timeSpentSec?: number;
  /** Nilai essay yang sudah dinilai admin (L.2.7); null = belum dinilai. */
  gradedScore?: number | null;
}

export interface ScoringSection {
  id: string;
  /** Bobot subtes (J.1.5). */
  weight: number;
  passingGrade: number | null;
}

export interface ScoringConfig {
  /** Skor jawaban benar per bobot 1 (J.1.1). */
  correctScore: number;
  /** Skor jawaban salah per bobot 1, nol atau negatif (J.1.2). */
  wrongScore: number;
  /** Nilai minimal kelulusan total (J.1.6). */
  passingGrade: number;
  sections: ScoringSection[];
}

export type AnswerStatus = "BENAR" | "SALAH" | "KOSONG" | "MENUNGGU_PENILAIAN";

export interface QuestionResult {
  questionId: string;
  status: AnswerStatus;
  score: number;
  maxScore: number;
}

export interface SectionResult {
  sectionId: string;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  empty: number;
  passed: boolean | null;
}

export interface TopicResult {
  topic: string;
  correct: number;
  total: number;
  mastery: number;
  avgTimeSec: number;
}

export interface ExamScore {
  totalScore: number;
  maxScore: number;
  correct: number;
  wrong: number;
  empty: number;
  pending: number;
  passed: boolean;
  questions: QuestionResult[];
  sections: SectionResult[];
  topics: TopicResult[];
}

const round = (n: number) => Math.round(n * 100) / 100;

const normalizeText = (s: string) => s.toLocaleLowerCase("id-ID").replace(/\s+/g, " ").trim();

function isEmpty(q: ScoringQuestion, a: ScoringAnswer | undefined) {
  if (!a) return true;
  switch (q.type) {
    case "PG_TUNGGAL":
    case "PG_JAMAK":
    case "BENAR_SALAH":
      return !a.optionIds || a.optionIds.length === 0;
    case "ISIAN_SINGKAT":
    case "ESSAY":
      return !a.textAnswer || a.textAnswer.trim() === "";
    case "NUMERIK":
      return a.numberAnswer === null || a.numberAnswer === undefined || Number.isNaN(a.numberAnswer);
  }
}

function hasGradedOptions(q: ScoringQuestion) {
  return q.options.some((o) => o.score !== null);
}

/** Skor maksimum satu soal sebelum bobot subtes. */
export function questionMaxScore(q: ScoringQuestion, config: Pick<ScoringConfig, "correctScore">) {
  if (hasGradedOptions(q)) return Math.max(...q.options.map((o) => o.score ?? 0)) * q.weight;
  return config.correctScore * q.weight;
}

function scoreQuestion(q: ScoringQuestion, a: ScoringAnswer | undefined, config: ScoringConfig): QuestionResult {
  const maxScore = questionMaxScore(q, config);
  const base = { questionId: q.id, maxScore };
  if (isEmpty(q, a)) return { ...base, status: "KOSONG", score: 0 };
  const answer = a as ScoringAnswer;

  if (q.type === "ESSAY") {
    if (answer.gradedScore === null || answer.gradedScore === undefined) {
      return { ...base, status: "MENUNGGU_PENILAIAN", score: 0 };
    }
    const score = Math.min(Math.max(answer.gradedScore, 0), maxScore);
    return { ...base, status: score >= maxScore / 2 ? "BENAR" : "SALAH", score };
  }

  // Opsi bergradasi: skor = skor opsi yang dipilih; "benar" bila memilih opsi tertinggi.
  if (hasGradedOptions(q)) {
    const chosen = q.options.find((o) => o.id === answer.optionIds?.[0]);
    const score = (chosen?.score ?? 0) * q.weight;
    return { ...base, status: score >= maxScore ? "BENAR" : "SALAH", score };
  }

  let correct = false;
  switch (q.type) {
    case "PG_TUNGGAL":
    case "BENAR_SALAH": {
      const chosen = q.options.find((o) => o.id === answer.optionIds?.[0]);
      correct = answer.optionIds?.length === 1 && Boolean(chosen?.isCorrect);
      break;
    }
    case "PG_JAMAK": {
      const expected = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
      const picked = new Set(answer.optionIds);
      correct = expected.size === picked.size && [...expected].every((id) => picked.has(id));
      break;
    }
    case "ISIAN_SINGKAT": {
      const accepted = (q.correctText ?? "").split("|").map(normalizeText).filter(Boolean);
      correct = accepted.includes(normalizeText(answer.textAnswer ?? ""));
      break;
    }
    case "NUMERIK": {
      correct =
        q.correctNumber !== null &&
        Math.abs((answer.numberAnswer as number) - q.correctNumber) <= (q.tolerance ?? 0) + 1e-9;
      break;
    }
  }
  return {
    ...base,
    status: correct ? "BENAR" : "SALAH",
    score: (correct ? config.correctScore : config.wrongScore) * q.weight,
  };
}

/** Hitung nilai satu percobaan tryout. */
export function scoreExam(
  questions: ScoringQuestion[],
  answers: Record<string, ScoringAnswer | undefined>,
  config: ScoringConfig,
): ExamScore {
  const results = questions.map((q) => scoreQuestion(q, answers[q.id], config));
  const sectionWeight = new Map(config.sections.map((s) => [s.id, s.weight]));

  const sections: SectionResult[] = config.sections.map((s) => {
    const items = questions
      .map((q, i) => ({ q, r: results[i] }))
      .filter(({ q }) => q.sectionId === s.id);
    const score = round(items.reduce((n, { r }) => n + r.score, 0) * s.weight);
    return {
      sectionId: s.id,
      score,
      maxScore: round(items.reduce((n, { r }) => n + r.maxScore, 0) * s.weight),
      correct: items.filter(({ r }) => r.status === "BENAR").length,
      wrong: items.filter(({ r }) => r.status === "SALAH").length,
      empty: items.filter(({ r }) => r.status === "KOSONG").length,
      passed: s.passingGrade === null ? null : score >= s.passingGrade,
    };
  });

  const topicMap = new Map<string, { correct: number; total: number; time: number }>();
  questions.forEach((q, i) => {
    const t = topicMap.get(q.topic) ?? { correct: 0, total: 0, time: 0 };
    t.total += 1;
    if (results[i].status === "BENAR") t.correct += 1;
    t.time += answers[q.id]?.timeSpentSec ?? 0;
    topicMap.set(q.topic, t);
  });
  const topics: TopicResult[] = [...topicMap].map(([topic, t]) => ({
    topic,
    correct: t.correct,
    total: t.total,
    mastery: round((t.correct / t.total) * 100),
    avgTimeSec: round(t.time / t.total),
  }));

  const totalScore = round(sections.reduce((n, s) => n + s.score, 0));
  const unknownSection = questions.find((q) => !sectionWeight.has(q.sectionId));
  if (unknownSection) throw new Error(`Soal ${unknownSection.id} merujuk subtes yang tidak ada`);

  return {
    totalScore,
    maxScore: round(sections.reduce((n, s) => n + s.maxScore, 0)),
    correct: results.filter((r) => r.status === "BENAR").length,
    wrong: results.filter((r) => r.status === "SALAH").length,
    empty: results.filter((r) => r.status === "KOSONG").length,
    pending: results.filter((r) => r.status === "MENUNGGU_PENILAIAN").length,
    passed: totalScore >= config.passingGrade && sections.every((s) => s.passed !== false),
    questions: results,
    sections,
    topics,
  };
}
