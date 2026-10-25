// Konversi antara Date (UTC di database) dan nilai <input type="datetime-local"> yang
// dibaca sebagai waktu Asia/Jakarta (UTC+7, tanpa musim panas).

const OFFSET_MS = 7 * 3600_000;

/** Date → "YYYY-MM-DDTHH:mm" dalam WIB untuk nilai awal input. */
export function toJakartaInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" (WIB) → Date, atau null bila kosong/tidak valid. */
export function fromJakartaInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi) - OFFSET_MS;
  const date = new Date(utc);
  // Tolak tanggal yang tidak ada (mis. 31 Februari) yang digulirkan Date.UTC.
  return toJakartaInput(date) === value.trim() ? date : null;
}
