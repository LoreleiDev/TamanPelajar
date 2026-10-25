// Fungsi murni untuk statistik dashboard admin (M.2), diuji unit.

const JAKARTA_OFFSET_MS = 7 * 3600_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Kunci "YYYY-MM" bulan kalender Jakarta untuk sebuah waktu UTC. */
export function jakartaMonthKey(date: Date): string {
  const d = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * n bulan terakhir (termasuk bulan berjalan), urut lama ke baru, beserta awal bulan
 * pertama dalam UTC untuk filter query.
 */
export function lastMonths(now: Date, n: number): { keys: { key: string; label: string }[]; since: Date } {
  const j = new Date(now.getTime() + JAKARTA_OFFSET_MS);
  const keys: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth() - i, 1));
    const month = d.getUTCMonth();
    const label = month === 0 || i === n - 1 ? `${MONTHS[month]} ${String(d.getUTCFullYear()).slice(2)}` : MONTHS[month];
    keys.push({ key: `${d.getUTCFullYear()}-${String(month + 1).padStart(2, "0")}`, label });
  }
  const first = new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth() - (n - 1), 1));
  return { keys, since: new Date(first.getTime() - JAKARTA_OFFSET_MS) };
}

/** Isi bulan tanpa data dengan 0 agar grafik tidak melompati bulan. */
export function fillMonths(keys: { key: string; label: string }[], rows: { month: string; value: number }[]) {
  const map = new Map(rows.map((r) => [r.month, r.value]));
  return keys.map((k) => ({ label: k.label, value: map.get(k.key) ?? 0 }));
}

/** Persen dibulatkan satu desimal; 0 bila penyebut 0. */
export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);
