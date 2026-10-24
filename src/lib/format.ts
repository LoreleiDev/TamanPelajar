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
