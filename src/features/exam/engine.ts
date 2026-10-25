// Aturan inti tryout CBT (I.4) sebagai fungsi murni: urutan acak dari seed yang disimpan
// (I.4.13) dan jadwal subtes berdurasi sendiri (I.4.14–I.4.15). Tanpa akses database
// agar mudah diuji unit; dipakai halaman ujian, server action, dan halaman pembahasan.

/** PRNG deterministik 32-bit (mulberry32). Seed sama menghasilkan urutan sama. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash string sederhana (FNV-1a) untuk menurunkan seed per subtes dan per soal. */
export function hashString(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface OrderableQuestion<O> {
  id: string;
  type: string;
  options: O[];
}

/**
 * Urutan soal dan opsi untuk satu percobaan. Soal diacak di dalam subtesnya, opsi diacak
 * per soal. Soal benar/salah tidak diacak opsinya agar "Benar" tetap di atas.
 */
export function orderForAttempt<O extends { id: string }, Q extends OrderableQuestion<O>, S extends { id: string; questions: Q[] }>(
  sections: S[],
  seed: number,
  config: { shuffleQuestions: boolean; shuffleOptions: boolean },
): S[] {
  return sections.map((s) => {
    const questions = config.shuffleQuestions ? seededShuffle(s.questions, seed ^ hashString(s.id)) : s.questions;
    return {
      ...s,
      questions: questions.map((q) =>
        config.shuffleOptions && q.type !== "BENAR_SALAH" ? { ...q, options: seededShuffle(q.options, seed ^ hashString(q.id)) } : q,
      ),
    };
  });
}

/** Label tampilan opsi mengikuti posisi setelah diacak: A, B, C, ... */
export const optionLabel = (index: number) => String.fromCharCode(65 + index);

export interface SectionTiming {
  sectionId: string;
  durationMin: number | null;
  startedAt: Date | null;
  deadlineAt: Date | null;
  submittedAt: Date | null;
}

export interface Timeline {
  /** "berurutan": subtes dikerjakan satu per satu dengan waktu sendiri; "bebas": satu waktu untuk semua. */
  mode: "berurutan" | "bebas";
  sections: SectionTiming[];
  /** Indeks subtes yang sedang berjalan; -1 bila semua sudah selesai atau waktu habis. */
  activeIndex: number;
  /** Batas waktu jendela yang sedang berjalan (subtes aktif atau seluruh ujian). */
  deadlineAt: Date | null;
  /** true bila ada subtes yang dimulai atau ditutup, sehingga perlu disimpan. */
  changed: boolean;
}

export const timelineMode = (sections: Pick<SectionTiming, "durationMin">[]) =>
  sections.length > 0 && sections.every((s) => s.durationMin !== null && s.durationMin > 0) ? "berurutan" : "bebas";

/**
 * Jadwal subtes saat percobaan dimulai: subtes pertama langsung berjalan. Mode berurutan
 * memakai jumlah durasi subtes; mode bebas memakai durasi tryout.
 */
export function initialTimeline(
  sections: { sectionId: string; durationMin: number | null }[],
  startedAt: Date,
  examDurationMin: number,
): { sections: SectionTiming[]; deadlineAt: Date } {
  const mode = timelineMode(sections);
  const totalMin = mode === "berurutan" ? sections.reduce((n, s) => n + (s.durationMin ?? 0), 0) : examDurationMin;
  const empty = sections.map((s) => ({ ...s, startedAt: null, deadlineAt: null, submittedAt: null }));
  const deadlineAt = new Date(startedAt.getTime() + totalMin * 60_000);
  if (mode === "bebas") return { sections: empty, deadlineAt };
  return { sections: advanceTimeline(empty, startedAt, deadlineAt, startedAt).sections, deadlineAt };
}

/**
 * Majukan jadwal sampai waktu `now`: subtes yang batas waktunya lewat ditutup pada batas
 * itu, dan subtes berikutnya dimulai tepat saat subtes sebelumnya selesai. Waktu tetap
 * berjalan saat peserta menutup halaman, seperti ujian di ruangan.
 */
export function advanceTimeline(sections: SectionTiming[], attemptStartedAt: Date, attemptDeadline: Date, now: Date): Timeline {
  const mode = timelineMode(sections);
  const out = sections.map((s) => ({ ...s }));
  if (mode === "bebas") {
    const open = now < attemptDeadline;
    return { mode, sections: out, activeIndex: open ? 0 : -1, deadlineAt: attemptDeadline, changed: false };
  }

  let changed = false;
  let prevEnd = attemptStartedAt;
  for (let i = 0; i < out.length; i++) {
    const s = out[i];
    if (s.submittedAt) {
      prevEnd = s.submittedAt;
      continue;
    }
    if (!s.startedAt || !s.deadlineAt) {
      s.startedAt = prevEnd;
      const end = prevEnd.getTime() + (s.durationMin as number) * 60_000;
      s.deadlineAt = new Date(Math.min(end, attemptDeadline.getTime()));
      changed = true;
    }
    if (s.deadlineAt <= now) {
      s.submittedAt = s.deadlineAt;
      prevEnd = s.deadlineAt;
      changed = true;
      continue;
    }
    return { mode, sections: out, activeIndex: i, deadlineAt: s.deadlineAt, changed };
  }
  return { mode, sections: out, activeIndex: -1, deadlineAt: null, changed };
}

/** Peserta menutup subtes aktif lebih awal; subtes berikutnya langsung dimulai. */
export function finishActiveSection(timeline: Timeline, attemptStartedAt: Date, attemptDeadline: Date, now: Date): Timeline {
  if (timeline.mode === "bebas" || timeline.activeIndex < 0) return timeline;
  const sections = timeline.sections.map((s, i) => (i === timeline.activeIndex ? { ...s, submittedAt: now } : { ...s }));
  return { ...advanceTimeline(sections, attemptStartedAt, attemptDeadline, now), changed: true };
}

/** Peringatan sisa waktu (I.4.5), dalam menit. */
export const TIME_WARNINGS = [10, 5, 1] as const;

export type StartBlock = "BELUM_MASUK" | "PERLU_PAKET" | "BELUM_DIBUKA" | "SUDAH_DITUTUP" | "BATAS_PERCOBAAN";

/**
 * Boleh memulai percobaan baru? (I.1, I.2). Percobaan yang masih berjalan tidak dihitung di
 * sini; halaman petunjuk menawarkan "Lanjutkan" lebih dulu. Admin tidak butuh paket.
 */
export function startBlock(input: {
  now: Date;
  loggedIn: boolean;
  isAdmin: boolean;
  enrolled: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
  attemptsUsed: number;
  maxAttempts: number;
}): StartBlock | null {
  if (!input.loggedIn) return "BELUM_MASUK";
  if (!input.isAdmin && !input.enrolled) return "PERLU_PAKET";
  if (input.opensAt && input.now < input.opensAt) return "BELUM_DIBUKA";
  if (input.closesAt && input.now >= input.closesAt) return "SUDAH_DITUTUP";
  if (input.attemptsUsed >= input.maxAttempts) return "BATAS_PERCOBAAN";
  return null;
}

export const startBlockMessage: Record<StartBlock, string> = {
  BELUM_MASUK: "Masuk dulu untuk mengerjakan tryout.",
  PERLU_PAKET: "Tryout ini terbuka untuk pemilik paket yang mencakupnya.",
  BELUM_DIBUKA: "Tryout ini belum dibuka.",
  SUDAH_DITUTUP: "Jadwal tryout ini sudah ditutup.",
  BATAS_PERCOBAAN: "Batas percobaan tryout ini sudah habis.",
};
