const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const tanggal = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "Asia/Jakarta",
});

const tanggalJam = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

/** Uang disimpan sebagai Int rupiah; tampilkan sebagai "Rp 150.000". */
export function formatRupiah(amount: number): string {
  return rupiah.format(amount);
}

/** Waktu disimpan UTC; tampilkan dalam zona Asia/Jakarta. */
export function formatTanggal(date: Date): string {
  return tanggal.format(date);
}

export function formatTanggalJam(date: Date): string {
  return tanggalJam.format(date);
}

/** Durasi video: "12:05" atau "1:02:05". */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Waktu belajar: "45 menit", "3 jam 20 menit". */
export function formatStudyTime(totalSec: number): string {
  const minutes = Math.round(totalSec / 60);
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} jam ${m} menit` : `${h} jam`;
}
