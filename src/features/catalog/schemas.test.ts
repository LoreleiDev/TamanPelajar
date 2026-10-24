import { describe, expect, it } from "vitest";

import { categories } from "./mock-data";
import { activeFilterCount, catalogHref, parseCatalogFilter as parse } from "./schemas";

const slugs = categories.map((c) => c.slug);
const parseCatalogFilter = (p: Parameters<typeof parse>[0]) => parse(p, slugs);

describe("parseCatalogFilter", () => {
  it("membuang nilai yang tidak dikenal dan memakai bawaan", () => {
    const f = parseCatalogFilter({
      kategori: ["cpns", "tidak-ada"],
      jenis: "TRYOUT,PALSU",
      hargaMaks: "123",
      ratingMin: "abc",
      urut: "acak",
      halaman: "-2",
    });
    expect(f).toMatchObject({
      kategori: ["cpns"],
      jenis: ["TRYOUT"],
      hargaMaks: undefined,
      ratingMin: undefined,
      urut: "terpopuler",
      halaman: 1,
    });
  });

  it("memotong kata kunci yang terlalu panjang", () => {
    expect(parseCatalogFilter({ q: "a".repeat(200) }).q).toHaveLength(80);
  });
});

describe("catalogHref", () => {
  it("menulis hanya nilai yang bukan bawaan dan bisa dibaca ulang", () => {
    const f = parseCatalogFilter({ q: "skd", kategori: "cpns", urut: "termurah", halaman: "2" });
    const href = catalogHref(f, { halaman: 1 });
    expect(href).toBe("/program?q=skd&kategori=cpns&urut=termurah");
    const round = parseCatalogFilter(Object.fromEntries(new URL(href, "http://x").searchParams));
    expect(round).toMatchObject({ q: "skd", kategori: ["cpns"], urut: "termurah" });
  });

  it("menghitung filter aktif", () => {
    expect(activeFilterCount(parseCatalogFilter({ kategori: ["cpns", "tes-bumn"], hargaMaks: "300000" }))).toBe(3);
  });
});
