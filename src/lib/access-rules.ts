// Aturan akses materi sebagai fungsi murni (tanpa database), diuji di access.test.ts.

export type LessonAccess =
  | "terbuka"
  /** Tamu: harus masuk dulu (C.5.2). */
  | "perlu-masuk"
  /** Bab berbayar dan belum ada langganan aktif (G.4.11). */
  | "perlu-langganan"
  /** Materi sebelumnya belum selesai pada kelas berurutan (G.4.3). */
  | "terkunci-urutan";

export interface AccessInput {
  user: { id: string; role: "ADMIN" | "USER" } | null;
  sectionIsFree: boolean;
  enrolled: boolean;
  /** true bila kelas berurutan dan ada materi sebelumnya yang belum selesai. */
  previousIncomplete: boolean;
}

/** Aturan akses sebagai fungsi murni agar mudah diuji. */
export function resolveLessonAccess({ user, sectionIsFree, enrolled, previousIncomplete }: AccessInput): LessonAccess {
  if (!user) return "perlu-masuk";
  if (user.role === "ADMIN") return "terbuka";
  if (!sectionIsFree && !enrolled) return "perlu-langganan";
  if (previousIncomplete) return "terkunci-urutan";
  return "terbuka";
}
