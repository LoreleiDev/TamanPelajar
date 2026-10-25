import { describe, expect, it } from "vitest";

import { fromJakartaInput, toJakartaInput } from "./datetime";

describe("input tanggal WIB", () => {
  it("bolak-balik tanpa bergeser", () => {
    const d = new Date("2026-10-25T03:30:00Z");
    expect(toJakartaInput(d)).toBe("2026-10-25T10:30");
    expect(fromJakartaInput("2026-10-25T10:30")?.toISOString()).toBe("2026-10-25T03:30:00.000Z");
  });

  it("melewati tengah malam ke hari sebelumnya di UTC", () => {
    expect(fromJakartaInput("2026-01-01T03:00")?.toISOString()).toBe("2025-12-31T20:00:00.000Z");
  });

  it("kosong dan tanggal mustahil menjadi null", () => {
    expect(fromJakartaInput("")).toBeNull();
    expect(fromJakartaInput("2026-02-31T10:00")).toBeNull();
    expect(fromJakartaInput("besok")).toBeNull();
    expect(toJakartaInput(null)).toBe("");
  });
});
