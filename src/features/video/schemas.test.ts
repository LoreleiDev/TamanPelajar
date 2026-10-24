import { describe, expect, it } from "vitest";

import { parseVideoFilter, videoHref } from "./schemas";

describe("parseVideoFilter", () => {
  it("membuang nilai yang tidak dikenal", () => {
    expect(parseVideoFilter({ durasi: "sangat-lama", kesulitan: "MUDAH", status: "sudah", halaman: "0" })).toEqual({
      q: undefined,
      kategori: undefined,
      mapel: undefined,
      durasi: undefined,
      kesulitan: "MUDAH",
      status: "sudah",
      halaman: 1,
    });
  });

  it("membangun URL yang bisa dibaca ulang tanpa nilai bawaan", () => {
    const f = parseVideoFilter({ mapel: "Penalaran Umum", durasi: "pendek", halaman: "2" });
    const href = videoHref(f, { halaman: 1 });
    expect(href).toBe("/video?mapel=Penalaran+Umum&durasi=pendek");
    expect(parseVideoFilter(Object.fromEntries(new URL(href, "http://x").searchParams))).toMatchObject({
      mapel: "Penalaran Umum",
      durasi: "pendek",
    });
  });
});
