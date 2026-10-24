import { z } from "zod";

// Parameter URL pustaka video (H.1). Nilai yang tidak dikenal dibuang.

export const DURATION_BUCKETS = {
  pendek: { label: "Di bawah 5 menit", max: 5 * 60 },
  sedang: { label: "5–15 menit", min: 5 * 60, max: 15 * 60 },
  panjang: { label: "Lebih dari 15 menit", min: 15 * 60 },
} as const;
export type DurationBucket = keyof typeof DURATION_BUCKETS;

export const DIFFICULTY_LABELS = { MUDAH: "Mudah", SEDANG: "Sedang", SULIT: "Sulit" } as const;
export type DifficultyKey = keyof typeof DIFFICULTY_LABELS;

export const WATCH_STATUS = { sudah: "Sudah ditonton", belum: "Belum ditonton" } as const;
export type WatchStatus = keyof typeof WATCH_STATUS;

export interface VideoFilter {
  q?: string;
  kategori?: string;
  mapel?: string;
  durasi?: DurationBucket;
  kesulitan?: DifficultyKey;
  status?: WatchStatus;
  halaman: number;
}

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const oneOf = <T extends string>(v: string | undefined, keys: readonly T[]) => (v && keys.includes(v as T) ? (v as T) : undefined);

export function parseVideoFilter(sp: Params): VideoFilter {
  const page = Number(first(sp.halaman));
  return {
    q: first(sp.q)?.slice(0, 80),
    kategori: first(sp.kategori)?.slice(0, 80),
    mapel: first(sp.mapel)?.slice(0, 80),
    durasi: oneOf(first(sp.durasi), Object.keys(DURATION_BUCKETS) as DurationBucket[]),
    kesulitan: oneOf(first(sp.kesulitan), Object.keys(DIFFICULTY_LABELS) as DifficultyKey[]),
    status: oneOf(first(sp.status), Object.keys(WATCH_STATUS) as WatchStatus[]),
    halaman: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function videoHref(f: VideoFilter, patch: Partial<VideoFilter> = {}) {
  const next = { ...f, ...patch };
  const sp = new URLSearchParams();
  for (const k of ["q", "kategori", "mapel", "durasi", "kesulitan", "status"] as const) {
    if (next[k]) sp.set(k, String(next[k]));
  }
  if (next.halaman > 1) sp.set("halaman", String(next.halaman));
  const qs = sp.toString();
  return qs ? `/video?${qs}` : "/video";
}

const id = z.string().min(1).max(40);

export const videoProgressSchema = z.object({
  videoId: id,
  positionSec: z.number().int().min(0).max(24 * 3600),
  watchedDeltaSec: z.number().int().min(0).max(120),
});

export const videoIdSchema = z.object({ videoId: id });

export const videoNoteSchema = z.object({
  videoId: id,
  content: z.string().max(5000, "Catatan maksimal 5.000 karakter"),
});
