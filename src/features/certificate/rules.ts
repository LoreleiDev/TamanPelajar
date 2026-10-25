// Aturan murni sertifikat kelas berbasis batch (C.1.9, G.4.6, revisi RMED): syarat nilai,
// batch berjalan, dan kapan tugas praktik boleh dikirim. Tanpa Prisma agar mudah diuji unit.

export interface BatchWindow {
  id: string;
  startsAt: Date;
  endsAt: Date;
}

export type ParticipantStatus = "BERJALAN" | "MENUNGGU_PENILAIAN" | "REVISI" | "LULUS" | "GAGAL";

/** Batch yang sedang berjalan pada `now` (mulai ≤ now ≤ selesai). Bila tumpang tindih, yang mulai paling akhir. */
export function pickCurrentBatch<B extends BatchWindow>(batches: B[], now: Date): B | null {
  const running = batches.filter((b) => b.startsAt <= now && now <= b.endsAt);
  return running.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0] ?? null;
}

/** Batch terdekat yang belum dimulai. */
export function pickNextBatch<B extends BatchWindow>(batches: B[], now: Date): B | null {
  return batches.filter((b) => b.startsAt > now).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] ?? null;
}

/**
 * Rata-rata nilai terbaik setiap kuis kelas. Kuis yang belum dikerjakan dihitung 0.
 * Kelas tanpa kuis mengembalikan null (syarat nilai dianggap terpenuhi).
 */
export function averageBestQuizScore(quizzes: { best: number | null }[]): number | null {
  if (quizzes.length === 0) return null;
  const sum = quizzes.reduce((acc, q) => acc + (q.best ?? 0), 0);
  return Math.round((sum / quizzes.length) * 10) / 10;
}

export interface Requirement {
  completed: number;
  total: number;
  average: number | null;
  minScore: number;
}

export const materialsDone = (r: Requirement) => r.total > 0 && r.completed >= r.total;
export const scoreMet = (r: Requirement) => r.average === null || r.average >= r.minScore;
/** Syarat sebelum tugas praktik: semua materi selesai dan rata-rata kuis memenuhi nilai minimal. */
export const meetsRequirement = (r: Requirement) => materialsDone(r) && scoreMet(r);

/**
 * Boleh mengirim tugas praktik? Hanya selama batch berjalan, setelah syarat terpenuhi, dan
 * saat status BERJALAN (kiriman pertama) atau REVISI (kiriman ulang sekali).
 */
export function canSubmitPractical(input: { status: ParticipantStatus; requirement: Requirement; now: Date; endsAt: Date }) {
  if (input.now > input.endsAt) return false;
  if (input.status !== "BERJALAN" && input.status !== "REVISI") return false;
  return meetsRequirement(input.requirement);
}

/** Admin hanya boleh meminta revisi sekali per batch dan selama batch belum berakhir. */
export function canRequestRevision(input: { revisionsGiven: number; now: Date; endsAt: Date }) {
  return input.revisionsGiven === 0 && input.now <= input.endsAt;
}

/** Status yang otomatis menjadi GAGAL saat batch berakhir (tugas belum dikirim atau revisi tak dikirim). */
export const expiresWithBatch = (status: ParticipantStatus) => status === "BERJALAN" || status === "REVISI";

/** Link tugas harus Google Drive / Google Docs lewat HTTPS. */
export function isDriveUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["drive.google.com", "docs.google.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

/** Nomor sertifikat yang bisa diverifikasi publik. */
export function certificateNumber(input: { year: number; courseSlug: string; sequence: number; userId: string }) {
  return `TP-${input.year}-${input.courseSlug.slice(0, 3).toUpperCase()}-${String(input.sequence).padStart(4, "0")}-${input.userId.slice(-4).toUpperCase()}`;
}
