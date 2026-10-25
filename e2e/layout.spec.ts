import { expect, test } from "@playwright/test";

test.describe("navbar desktop", () => {
  test.skip(({ isMobile }) => isMobile, "khusus desktop");

  test("menu utama menandai halaman aktif dan pencarian membuka katalog", async ({ page }) => {
    await page.goto("/tentang");
    const nav = page.getByRole("navigation", { name: "Menu utama" });
    await expect(nav.getByRole("link")).toHaveText(["Beranda", "Mulai Belajar", "Tryout", "Video", "Kelas Online", "Informasi"]);

    await page.getByRole("searchbox", { name: "Cari program, kelas, atau tryout" }).fill("skd");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/program\?q=skd/);
  });
});

test.describe("navigasi mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "khusus mobile");

  test("hamburger membuka menu dan menutup setelah memilih", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Buka menu" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("link", { name: "Tryout" }).click();
    await expect(page).toHaveURL(/\/tryout$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("tamu yang membuka Transaksi melihat dialog masuk dengan callbackUrl (C.5.3)", async ({ page }) => {
    await page.goto("/tentang", { waitUntil: "networkidle" });
    await page.getByRole("navigation", { name: "Navigasi bawah" }).getByRole("button", { name: "Transaksi" }).click();
    const dialog = page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/masuk?callbackUrl=%2Ftentang");
  });
});

test("halaman yang tidak ada menampilkan 404 khusus", async ({ page }) => {
  const res = await page.goto("/halaman-yang-tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Halaman ini tidak ditemukan" })).toBeVisible();
});

test("slug yang tidak ada memberi status 404 asli, bukan soft 404 (Q.2, P.2.7)", async ({ request }) => {
  for (const path of [
    "/paket/tidak-ada",
    "/tryout/tidak-ada",
    "/video/tidak-ada",
    "/kelas/tidak-ada",
    "/kelas/tes-wawasan-kebangsaan/tidak-ada",
    "/sertifikat/TIDAK-ADA",
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  expect((await request.get("/kelas/tes-wawasan-kebangsaan")).status()).toBe(200);
});
