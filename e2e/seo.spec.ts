import { expect, test } from "@playwright/test";

// SEO (Q.2): sitemap, robots.txt, metadata, dan Open Graph halaman publik.
test.describe("SEO (Q.2)", () => {
  test.skip(({ isMobile }) => isMobile, "tidak bergantung perangkat");

  test("robots.txt menutup halaman privat dan menunjuk sitemap (Q.2.4)", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    for (const path of ["/admin", "/dashboard", "/ujian", "/checkout", "/api/"]) expect(body).toContain(`Disallow: ${path}`);
    expect(body).toMatch(/Sitemap: .+\/sitemap\.xml/);
  });

  test("sitemap memuat halaman publik dan konten terbit saja (Q.2.3)", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBe(true);
    const xml = await res.text();
    for (const path of ["/program", "/paket/persiapan-skd-cpns", "/kelas/penalaran-umum", "/tryout/tryout-skd-paket-1", "/informasi"]) {
      expect(xml).toContain(`${path}</loc>`);
    }
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("/dashboard");
  });

  for (const path of ["/", "/paket/persiapan-skd-cpns", "/kelas/penalaran-umum", "/tryout/tryout-skd-paket-1"]) {
    test(`metadata dan Open Graph lengkap di ${path} (Q.2.1–Q.2.2)`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/Taman Pelajar|SKD|Penalaran/);
      for (const sel of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'link[rel="canonical"]']) {
        await expect(page.locator(sel)).toHaveCount(1);
      }
    });
  }
});
