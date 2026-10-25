import { expect, test, type Page } from "@playwright/test";

async function masuk(page: Page, email: string) {
  await page.goto("/masuk?callbackUrl=%2Fvideo");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/video$/);
}

test.describe("video belajar (H)", () => {
  test("tamu melihat pustaka dan filter, tetapi harus masuk untuk menonton (C.5)", async ({ page }) => {
    // networkidle: tunggu salinan konten yang di-stream (div hidden) selesai ditukar.
    await page.goto("/video", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /^\d+ video$/ })).toHaveText("48 video");
    await page.getByRole("form", { name: "Filter video" }).getByLabel("Mata pelajaran").selectOption("Penalaran Umum");
    await expect(page).toHaveURL(/mapel=Penalaran\+Umum/);
    await expect(page.getByRole("heading", { name: /^\d+ video$/ })).toHaveText("9 video");

    await page.goto("/video/penalaran-umum-silogisme", { waitUntil: "networkidle" });
    await expect(page.locator("video")).toHaveCount(0);
    await page.getByRole("button", { name: "Masuk untuk menonton" }).click();
    await expect(page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" })).toBeVisible();
  });

  test("video bab berbayar terkunci tanpa langganan; video tidak ada memberi 404", async ({ page }) => {
    await masuk(page, "user4@tamanpelajar.test");
    await page.goto("/video/tes-wawasan-kebangsaan-pasal-yang-sering-ditanyakan");
    await expect(page.getByRole("main").getByText("Video ini ada di bab untuk pelanggan.")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Transkrip" })).toHaveCount(0);
    const res = await page.goto("/video/video-yang-tidak-ada");
    expect(res?.status()).toBe(404);
  });

  test("pelanggan menonton, menyimpan video, dan melihat transkrip (H.2)", async ({ page }) => {
    await masuk(page, "user1@tamanpelajar.test");
    await page.goto("/video/tes-wawasan-kebangsaan-pasal-yang-sering-ditanyakan");
    await expect(page.locator("video")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Transkrip" })).toBeVisible();
    await page.getByRole("button", { name: "Simpan video" }).click();
    await expect(page.getByRole("button", { name: "Tersimpan" })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Tersimpan" }).click();
    await expect(page.getByRole("button", { name: "Simpan video" })).toBeVisible();
  });

  test("filter status tonton hanya untuk pengguna yang masuk", async ({ page }) => {
    await masuk(page, "user1@tamanpelajar.test");
    await page.getByLabel("Status").selectOption("sudah");
    await expect(page).toHaveURL(/status=sudah/);
    const cards = page.getByRole("article");
    await expect(cards.first()).toBeVisible();
    await expect(cards.filter({ hasNotText: "Sudah ditonton" })).toHaveCount(0);
  });
});
