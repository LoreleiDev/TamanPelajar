import { describe, expect, it } from "vitest";

import { fillMonths, jakartaMonthKey, lastMonths, percent } from "./stats";

describe("statistik admin", () => {
  it("bulan dihitung dalam zona Jakarta", () => {
    // 31 Mei 2026 pukul 20.00 UTC = 1 Juni 03.00 WIB.
    expect(jakartaMonthKey(new Date("2026-05-31T20:00:00Z"))).toBe("2026-06");
    expect(jakartaMonthKey(new Date("2026-05-31T16:59:00Z"))).toBe("2026-05");
  });

  it("enam bulan terakhir melewati pergantian tahun", () => {
    const { keys, since } = lastMonths(new Date("2026-02-10T00:00:00Z"), 6);
    expect(keys.map((k) => k.key)).toEqual(["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(keys[0].label).toBe("Sep 25");
    expect(keys[4].label).toBe("Jan 26");
    expect(keys[5].label).toBe("Feb");
    // Awal 1 September WIB = 31 Agustus 17.00 UTC.
    expect(since.toISOString()).toBe("2025-08-31T17:00:00.000Z");
  });

  it("bulan kosong diisi nol", () => {
    const { keys } = lastMonths(new Date("2026-03-15T00:00:00Z"), 3);
    expect(fillMonths(keys, [{ month: "2026-02", value: 5 }]).map((r) => r.value)).toEqual([0, 5, 0]);
  });

  it("persen aman untuk penyebut nol", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(0, 0)).toBe(0);
  });
});
