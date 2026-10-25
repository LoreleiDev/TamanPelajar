import { z } from "zod";

// Rentang laporan admin (M.2, L.2.9) dalam tanggal WIB, sebagai fungsi murni.

const OFFSET = 7 * 3600_000;
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Awal hari WIB (UTC) untuk "YYYY-MM-DD". */
export const startOfJakartaDay = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) - OFFSET);

/** "YYYY-MM-DD" hari ini di WIB. */
export const jakartaToday = (now = new Date()) => new Date(now.getTime() + OFFSET).toISOString().slice(0, 10);

/** Rentang laporan dari parameter URL; bawaan awal bulan berjalan sampai hari ini (WIB). */
export function reportRange(params: { dari?: unknown; sampai?: unknown }, now = new Date()) {
  const today = jakartaToday(now);
  const from = dateString.safeParse(params.dari).success ? (params.dari as string) : `${today.slice(0, 8)}01`;
  const to = dateString.safeParse(params.sampai).success ? (params.sampai as string) : today;
  const [a, b] = from <= to ? [from, to] : [to, from];
  return { from: a, to: b, start: startOfJakartaDay(a), end: new Date(startOfJakartaDay(b).getTime() + 86_400_000) };
}
