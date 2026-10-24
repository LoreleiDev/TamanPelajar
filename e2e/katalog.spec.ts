import { expect, test } from "@playwright/test";

const count = (page: import("@playwright/test").Page) => page.getByRole("heading", { name: /^\d+ paket/ });

test.describe("katalog program (D.2)", () => {
  test("filter desktop langsung diterapkan dan bisa dihapus lewat chip", async ({ page, isMobile }) => {
    test.skip(isMobile, "filter samping khusus desktop");
    await page.goto("/program");
    await expect(count(page)).toHaveText("12 paket");

    await page.getByRole("complementary", { name: "Filter program" }).getByLabel("SKD CPNS").check();
    await expect(page).toHaveURL(/kategori=cpns/);
    await expect(count(page)).toHaveText("3 paket");

    await page.getByRole("link", { name: "Hapus filter SKD CPNS" }).click();
    await expect(count(page)).toHaveText("12 paket");
    await expect(page.getByRole("complementary", { name: "Filter program" }).getByLabel("SKD CPNS")).not.toBeChecked();
  });

  test("urutan harga termurah menaruh paket termurah di depan", async ({ page }) => {
    await page.goto("/program");
    await page.getByLabel("Urutkan").selectOption("termurah");
    await expect(page).toHaveURL(/urut=termurah/);
    await expect(page.getByRole("article").first().getByRole("heading")).toHaveText("Tryout SKD 110 Soal");
  });

  test("pencarian, pagination, dan keadaan kosong", async ({ page }) => {
    await page.goto("/program");
    await page.getByRole("link", { name: "Halaman 2" }).click();
    await expect(page).toHaveURL(/halaman=2/);
    await expect(page.getByRole("article")).toHaveCount(3);

    await page.getByRole("searchbox", { name: "Cari paket" }).fill("tidakada");
    await page.getByRole("button", { name: "Cari", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Belum ada paket yang cocok" })).toBeVisible();
  });

  test("filter mobile diterapkan lewat sheet", async ({ page, isMobile }) => {
    test.skip(!isMobile, "khusus mobile");
    await page.goto("/program");
    await page.getByRole("button", { name: /^Filter/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filter program" });
    await sheet.getByLabel("Tryout", { exact: true }).check();
    await sheet.getByRole("button", { name: "Terapkan filter" }).click();
    await expect(page).toHaveURL(/jenis=TRYOUT/);
    await expect(count(page)).toHaveText("4 paket");
  });
});
