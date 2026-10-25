import { execSync } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

async function masuk(page: Page, email: string, callbackUrl: string) {
  await page.goto(`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${callbackUrl}$`));
}

/** Panel daftar soal: kolom kanan di desktop, sheet bawah di mobile. */
async function palette(page: Page, isMobile: boolean) {
  if (!isMobile) return page.getByRole("complementary", { name: "Daftar soal" });
  await page.getByRole("button", { name: /^Daftar soal \(/ }).click();
  return page.getByRole("dialog", { name: "Daftar soal" });
}

/** Jawab soal aktif apa pun jenisnya (urutan soal SKD diacak per percobaan). */
async function jawab(page: Page) {
  const main = page.getByRole("main");
  const options = main.locator("fieldset label");
  if (await options.count()) await options.first().click();
  else await main.getByRole("textbox").first().fill("5");
}

async function mulai(page: Page, slug: string) {
  await page.goto(`/tryout/${slug}`, { waitUntil: "networkidle" });
  const start = page.getByRole("button", { name: "Mulai Tryout" });
  await expect(start).toBeDisabled();
  await page.getByLabel(/Saya sudah membaca petunjuk/).check();
  await start.click();
  await expect(page).toHaveURL(/\/ujian\/[a-z0-9]+$/);
  await expect(page.getByRole("timer")).toHaveAccessibleName(/Sisa waktu \d{2}:\d{2}/);
  return page.url().split("/").pop()!;
}

test.describe("tryout CBT (I, T.6–T.10)", () => {
  test("tamu melihat daftar dan petunjuk, mulai memunculkan dialog masuk (I.1, I.2, C.5)", async ({ page }) => {
    await page.goto("/tryout");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 2 })).toHaveCount(3);
    await main.getByRole("link", { name: "Tryout SKD Paket 1", exact: true }).click();
    await expect(page).toHaveURL(/\/tryout\/tryout-skd-paket-1$/);
    await expect(page.getByRole("heading", { level: 1, name: "Tryout SKD Paket 1" })).toBeVisible();
    await expect(page.getByRole("table", { name: /Daftar subtes/ })).toContainText("TWK");
    await expect(page.getByText("Jawaban benar +5 per soal")).toBeVisible();

    await page.getByLabel(/Saya sudah membaca petunjuk/).check();
    await page.getByRole("button", { name: "Mulai Tryout" }).click();
    await expect(page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" })).toBeVisible();

    const res = await page.goto("/tryout/tryout-yang-tidak-ada");
    expect(res?.status()).toBe(404);
  });

  test("tanpa paket, petunjuk menawarkan paket yang mencakup tryout", async ({ page }) => {
    await masuk(page, "user4@tamanpelajar.test", "/dashboard");
    await page.goto("/tryout/tryout-skd-paket-1");
    await expect(page.getByRole("complementary").getByText("Tryout ini terbuka untuk pemilik paket yang mencakupnya.")).toBeVisible();
    await expect(page.getByRole("complementary").getByRole("link").first()).toHaveAttribute("href", /^\/paket\//);
    await expect(page.getByRole("button", { name: "Mulai Tryout" })).toHaveCount(0);
  });

  test("mengerjakan, autosave, refresh, pindah subtes, dan mengumpulkan (T.6–T.10)", async ({ page, isMobile }, info) => {
    test.slow();
    await masuk(page, `e2e-tryout-${info.project.name}@tamanpelajar.test`, "/dashboard");
    const attemptId = await mulai(page, "tryout-skd-paket-1");

    // Kunci jawaban tidak ikut terkirim ke halaman ujian.
    const html = await (await page.request.get(`/ujian/${attemptId}`)).text();
    expect(html).not.toContain("isCorrect");

    await expect(page.getByText(/^TWK, soal 1 dari 10$/)).toBeVisible();
    const main = page.getByRole("main");
    const firstBody = await main.locator(".rich-text").first().innerText();
    await main.locator("fieldset label").first().click();
    await main.getByRole("button", { name: "Ragu-ragu" }).click();
    await expect(main.getByText(/^Tersimpan \d/)).toBeVisible();
    await page.getByRole("button", { name: /^(Soal berikutnya|Berikutnya)$/ }).click();
    await expect(main.getByRole("heading", { name: "Soal 2" })).toBeVisible();

    // Muat ulang: soal aktif, jawaban, ragu-ragu, dan urutan acak tetap sama (I.4.4, I.4.13).
    await page.waitForTimeout(800);
    await page.reload();
    await expect(main.getByRole("heading", { name: "Soal 2" })).toBeVisible();
    let panel = await palette(page, isMobile);
    await expect(panel.getByRole("button", { name: "Soal 1, ragu-ragu" })).toBeVisible();
    await panel.getByRole("button", { name: "Soal 1, ragu-ragu" }).click();
    await expect(main.getByRole("heading", { name: /^Soal 1/ })).toBeVisible();
    expect(await main.locator(".rich-text").first().innerText()).toBe(firstBody);
    await expect(main.locator("fieldset input").first()).toBeChecked();

    // Selesaikan subtes TWK: konfirmasi menyebut soal yang belum dijawab (I.4.7–I.4.8).
    panel = await palette(page, isMobile);
    await panel.getByRole("button", { name: "Selesaikan subtes" }).click();
    const dialog = page.getByRole("dialog", { name: "Selesaikan TWK?" });
    await expect(dialog).toContainText("4 soal belum dijawab");
    await dialog.getByRole("button", { name: "Ya, selesaikan subtes" }).click();
    await expect(page.getByText(/^TIU, soal 6 dari 10$/)).toBeVisible();

    panel = await palette(page, isMobile);
    await expect(panel.getByRole("button", { name: /^Soal 1, ragu-ragu, subtes tidak aktif/ })).toBeDisabled();
    if (isMobile) await page.keyboard.press("Escape");
    await jawab(page);

    panel = await palette(page, isMobile);
    await panel.getByRole("button", { name: "Kumpulkan tryout" }).click();
    const submit = page.getByRole("dialog", { name: "Kumpulkan tryout?" });
    await expect(submit).toContainText("4 soal belum dijawab");
    await submit.getByRole("button", { name: "Ya, kumpulkan" }).click();
    await expect(page).toHaveURL(/\/dashboard\/riwayat$/);
    await expect(page.getByRole("main").getByText(/percobaan ke-1/).first()).toBeVisible();

    // Percobaan yang sudah dikumpulkan tidak bisa dibuka lagi.
    await page.goto(`/ujian/${attemptId}`);
    await expect(page).toHaveURL(/\/dashboard\/riwayat$/);
  });

  test("server menolak jawaban setelah waktu habis dan mengumpulkan otomatis (I.4.6, I.4.9)", async ({ page }, info) => {
    test.slow();
    await masuk(page, `e2e-tryout-${info.project.name}@tamanpelajar.test`, "/dashboard");
    const attemptId = await mulai(page, "tryout-tpa-paket-1");
    const main = page.getByRole("main");
    await main.locator("fieldset label").first().click();
    await expect(main.getByText(/^Tersimpan \d/)).toBeVisible();

    execSync(`pnpm exec tsx e2e/expire-attempt.ts ${attemptId}`);
    await main.locator("fieldset label").nth(1).click();
    await expect(page).toHaveURL(/\/dashboard\/riwayat$/);
    await expect(page.getByRole("main").getByText("Tryout TPA Paket 1").first()).toBeVisible();
  });
});
