import { describe, expect, it } from "vitest";

import { formatRupiah, formatTanggal, formatTanggalJam } from "./format";

// Intl memakai spasi tak terputus (U+00A0) antara "Rp" dan angka.
const normalize = (s: string) => s.replace(/ /g, " ");

describe("formatRupiah", () => {
  it("memformat rupiah tanpa desimal", () => {
    expect(normalize(formatRupiah(150000))).toBe("Rp 150.000");
    expect(normalize(formatRupiah(0))).toBe("Rp 0");
  });
});

describe("formatTanggal", () => {
  it("memakai zona Asia/Jakarta, bukan UTC", () => {
    // 31 Des 2026 18:30 UTC = 1 Jan 2027 01:30 WIB
    const date = new Date("2026-12-31T18:30:00Z");
    expect(formatTanggal(date)).toBe("1 Januari 2027");
    expect(normalize(formatTanggalJam(date))).toContain("01.30");
  });
});
