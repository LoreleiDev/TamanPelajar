import { expect, test } from "@playwright/test";

test.describe("beranda (D.1)", () => {
  test("menampilkan judul hero dan semua section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Taman Pelajar/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mulai langkah pertamumu menuju masa depan impian");
    for (const name of [
      "Pilih program sesuai ujianmu",
      "Paket yang paling banyak dipilih",
      "Pertanyaan yang sering ditanyakan",
      "Cerita dari siswa",
    ]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
  });

  test("soal contoh di hero menampilkan benar/salah dengan teks dan pembahasan", async ({ page }) => {
    await page.goto("/");
    const soal = page.getByRole("radiogroup", { name: /Lanjutkan deret/ });
    await soal.getByText("36", { exact: true }).click();
    await expect(page.getByText("Belum tepat, jawabannya B")).toBeVisible();
    await expect(page.getByText(/27 \+ 11 = 38/)).toBeVisible();
    await page.getByRole("button", { name: "Coba soal lain" }).click();
    await expect(page.getByRole("radiogroup", { name: /Rani tidak mengikuti wawancara/ })).toBeVisible();
  });

  test("pencarian langsung memfilter paket dan contoh mengganti kata kunci", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("searchbox", { name: "Cari paket belajar" });
    await input.fill("tpa");
    await expect(page.getByRole("link", { name: /Tes Potensi Akademik Lengkap/ })).toBeVisible();
    await input.fill("zzz");
    await expect(page.getByText("Belum ada paket untuk “zzz”")).toBeVisible();
    await page.getByRole("button", { name: "kedinasan" }).click();
    await expect(input).toHaveValue("kedinasan");
  });

  test("tamu yang menekan Beli sekarang melihat dialog masuk (C.5.3)", async ({ page }) => {
    // Tunggu hydration selesai: klik lebih awal memicu peringatan hydration mismatch di dev.
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Beli sekarang" }).first().click();
    await expect(page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" })).toBeVisible();
  });

  test("testimoni bisa digeser", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("1 dari 3")).toBeVisible();
    await page.getByRole("button", { name: "Cerita berikutnya" }).click();
    await expect(page.getByText("2 dari 3")).toBeVisible();
    await expect(page.getByText("Bagus Pratama")).toBeVisible();
  });
});
