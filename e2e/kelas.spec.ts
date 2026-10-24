import { expect, test, type Page } from "@playwright/test";

async function masuk(page: Page, email: string) {
  await page.goto(`/masuk?callbackUrl=${encodeURIComponent("/kelas")}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/kelas$/);
}

test.describe("kelas online (G, T.4, T.5, T.17, T.18)", () => {
  test("tamu melihat kurikulum, dan membuka materi memunculkan dialog masuk (T.17)", async ({ page }) => {
    await page.goto("/kelas/penalaran-umum", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1, name: "Penalaran Umum" })).toBeVisible();
    await page.getByRole("button", { name: /Jenis soal dan cara membaca pola/ }).click();
    await expect(page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" })).toBeVisible();

    // Server menolak ruang belajar untuk tamu (C.5.5).
    await page.goto("/kelas/penalaran-umum/jenis-soal-dan-cara-membaca-pola");
    await expect(page).toHaveURL(/\/masuk\?callbackUrl=/);
  });

  test("bab 1–2 terbuka setelah masuk, bab 3 terkunci tanpa langganan (T.18)", async ({ page }) => {
    await masuk(page, "user4@tamanpelajar.test");
    await page.goto("/kelas/tes-wawasan-kebangsaan/aspek-yang-diuji");
    await expect(page.locator("video")).toHaveCount(1);
    await expect(page.getByRole("link", { name: /Ringkasan bab 1 \(PDF\)/ })).toBeVisible();

    // Lampiran bab gratis dialihkan ke signed URL Cloudinary (G.4.4).
    const href = await page.getByRole("link", { name: /Ringkasan bab 1 \(PDF\)/ }).getAttribute("href");
    const res = await page.request.get(href!, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toMatch(/cloudinary\.com/);

    // Bab 3: konten dan URL video tidak dikirim, ada ajakan berlangganan (G.4.11–G.4.12).
    await page.goto("/kelas/tes-wawasan-kebangsaan/pasal-yang-sering-ditanyakan");
    await expect(page.getByRole("main").getByText("Materi ini ada di bab untuk pelanggan.")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(0);
    await page.getByRole("button", { name: "Lihat paket berlangganan" }).click();
    await expect(page.getByRole("dialog", { name: "Bab ini untuk pelanggan" }).getByRole("link", { name: "Lihat paket" }).first()).toBeVisible();
  });

  test("pelanggan membuka bab 3; tanda selesai dan catatan tersimpan setelah muat ulang (T.4, T.5)", async ({ page }) => {
    await masuk(page, "user1@tamanpelajar.test");
    await page.goto("/kelas/tes-wawasan-kebangsaan/studi-kasus-keberagaman");
    await expect(page.locator("video")).toHaveCount(1);

    await page.getByRole("button", { name: "Tandai selesai" }).click();
    await expect(page.getByRole("button", { name: "Sudah selesai" })).toBeVisible();

    const note = `Catatan uji ${Date.now()}`;
    await page.getByRole("main").getByLabel("Catatan pribadi untuk materi ini").fill(note);
    await expect(page.getByRole("main").getByText("Tersimpan", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Sudah selesai" })).toBeVisible();
    await expect(page.getByRole("main").getByLabel("Catatan pribadi untuk materi ini")).toHaveValue(note);

    // Kembalikan keadaan demo.
    await page.getByRole("button", { name: "Sudah selesai" }).click();
    await expect(page.getByRole("button", { name: "Tandai selesai" })).toBeVisible();
    await page.getByRole("main").getByLabel("Catatan pribadi untuk materi ini").fill("");
    await expect(page.getByRole("main").getByText("Tersimpan", { exact: true })).toBeVisible();
  });

  test("kuis dinilai di server dan menampilkan status dengan teks", async ({ page }) => {
    await masuk(page, "user1@tamanpelajar.test");
    await page.goto("/kelas/tes-wawasan-kebangsaan/kuis-uud-1945-dan-nkri");
    // Dibatasi ke <main>: saat streaming, salinan konten sempat berada di wadah tersembunyi.
    await page.getByRole("main").getByLabel(/MPR$/).check();
    await page.getByRole("button", { name: "Kumpulkan jawaban" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Nilai kuis" })).toBeVisible();
    await expect(page.getByRole("main").getByText("Benar", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("main").getByText("Tidak dijawab").first()).toBeVisible();
  });

  test("pencarian materi menyaring kurikulum (G.4.7)", async ({ page }) => {
    await masuk(page, "user1@tamanpelajar.test");
    await page.goto("/kelas/tes-wawasan-kebangsaan/aspek-yang-diuji");
    const nav = page.getByRole("navigation", { name: "Kurikulum kelas" });
    await nav.getByLabel("Cari materi di kelas ini").fill("lembaga");
    await expect(nav.getByRole("link")).toHaveCount(1);
    await expect(nav.getByRole("link", { name: /Lembaga negara/ })).toBeVisible();
  });
});
