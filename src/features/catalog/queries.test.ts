import { describe, expect, it } from "vitest";

import { CATALOG_PAGE_SIZE, effectivePrice, listRelatedProducts, searchCatalog } from "./queries";

describe("searchCatalog", () => {
  it("mencari tanpa membedakan huruf besar kecil dan mencocokkan semua kata", async () => {
    const { items } = await searchCatalog({ q: "tryout skd" });
    expect(items.length).toBeGreaterThan(0);
    for (const p of items) expect(`${p.name} ${p.summary} ${p.category.name}`.toLowerCase()).toContain("skd");
  });

  it("memfilter kategori, jenis, dan harga maksimum sekaligus", async () => {
    const { items } = await searchCatalog({ kategori: ["cpns"], jenis: ["TRYOUT"], hargaMaks: 100000 });
    expect(items.map((p) => p.slug)).toEqual(["tryout-skd-110-soal"]);
  });

  it("mengurutkan berdasarkan harga efektif (harga promo bila ada)", async () => {
    const { items } = await searchCatalog({ urut: "termurah" });
    const prices = items.map(effectivePrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("membagi halaman dan menjepit nomor halaman yang terlalu besar", async () => {
    const first = await searchCatalog({});
    expect(first.items).toHaveLength(CATALOG_PAGE_SIZE);
    const last = await searchCatalog({ halaman: 99 });
    expect(last.page).toBe(first.pageCount);
    expect(last.items.length).toBe(first.total - (first.pageCount - 1) * CATALOG_PAGE_SIZE);
  });

  it("filter rating minimum tidak meloloskan paket tanpa ulasan", async () => {
    const { items } = await searchCatalog({ ratingMin: 4 });
    expect(items.every((p) => p.ratingAvg !== null && p.ratingAvg >= 4)).toBe(true);
  });
});

describe("listRelatedProducts", () => {
  it("tidak menyertakan paket itu sendiri dan mendahulukan kategori yang sama", async () => {
    const { items } = await searchCatalog({ q: "Persiapan SKD CPNS" });
    const related = await listRelatedProducts(items[0]);
    expect(related.some((p) => p.id === items[0].id)).toBe(false);
    expect(related[0].category.slug).toBe("cpns");
  });
});
