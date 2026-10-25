import { describe, expect, it } from "vitest";

import { jakartaToday, reportRange } from "./report-range";

describe("rentang laporan", () => {
  it("bawaan awal bulan berjalan sampai hari ini (WIB)", () => {
    // 31 Oktober 20.00 UTC = 1 November 03.00 WIB.
    const r = reportRange({}, new Date("2026-10-31T20:00:00Z"));
    expect(r.from).toBe("2026-11-01");
    expect(r.to).toBe("2026-11-01");
    expect(r.start.toISOString()).toBe("2026-10-31T17:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-11-01T17:00:00.000Z");
  });

  it("menukar tanggal terbalik dan mengabaikan format salah", () => {
    const r = reportRange({ dari: "2026-10-20", sampai: "2026-10-01" }, new Date("2026-10-25T00:00:00Z"));
    expect([r.from, r.to]).toEqual(["2026-10-01", "2026-10-20"]);
    expect(reportRange({ dari: "kemarin" }, new Date("2026-10-25T00:00:00Z")).from).toBe("2026-10-01");
    expect(jakartaToday(new Date("2026-10-25T18:00:00Z"))).toBe("2026-10-26");
  });
});
