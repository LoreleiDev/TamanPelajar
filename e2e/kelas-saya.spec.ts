import { expect, test, type Page } from "@playwright/test";

// Tombol "Tambah kelas" dan testimoni siswa setelah kelas selesai (revisi RMED).

async function masuk(page: Page, email: string, callbackUrl: string) {
  await page.goto(`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${callbackUrl}$`));
}

test("tamu yang menekan Tambah kelas diminta masuk", async ({ page }) => {
  await page.goto("/kelas", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Tambah kelas Tes Karakteristik Pribadi" }).click();
  await expect(page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" })).toBeVisible();
});

test("siswa menambahkan kelas ke Kelas Saya lalu mengeluarkannya", async ({ page }, info) => {
  await masuk(page, `e2e-kelas-${info.project.name}@tamanpelajar.test`, "/kelas");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Tambah kelas Tes Karakteristik Pribadi" }).click();
  await expect(page.getByRole("button", { name: /Tes Karakteristik Pribadi sudah di Kelas Saya/ })).toBeVisible();

  await page.goto("/dashboard/kelas");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "Tes Karakteristik Pribadi" }) });
  await expect(card.getByText("Ditambahkan, bab gratis")).toBeVisible();
  await card.getByRole("button", { name: /sudah di Kelas Saya/ }).click();
  await expect(page.getByText("Tes Karakteristik Pribadi dikeluarkan dari Kelas Saya.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Tes Karakteristik Pribadi" })).toHaveCount(0);
});

test("kelas dari paket bertanda terdaftar", async ({ page }, info) => {
  // Peserta sertifikat berlangganan paket berisi Penalaran Umum (reset-db.ts).
  await masuk(page, `e2e-sertif-${info.project.name}@tamanpelajar.test`, "/dashboard");
  await page.goto("/kelas/penalaran-umum", { waitUntil: "networkidle" });
  await expect(page.getByText("Terdaftar lewat paket")).toBeVisible();
});

test("kelas 100% memunculkan popup testimoni; admin menerbitkannya", async ({ page, browser }, info) => {
  const opening = `Testimoni uji ${info.project.name}: logika jadi runtut`;
  await masuk(page, `e2e-sertif-${info.project.name}@tamanpelajar.test`, "/dashboard");
  // Ruang belajar mana pun di kelas yang sudah 100% memunculkan popup.
  await page.goto("/kelas/penalaran-umum", { waitUntil: "networkidle" });
  const first = await page.locator('a[href^="/kelas/penalaran-umum/"]').first().getAttribute("href");
  await page.goto(first!);
  const dialog = page.getByRole("dialog", { name: "Kelas Penalaran Umum selesai" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Kirim testimoni" }).click();
  await expect(dialog.getByText("Kalimat pembuka minimal 5 karakter")).toBeVisible();
  await dialog.getByLabel("Kalimat pembuka").fill(opening);
  await dialog.getByLabel("Ceritamu").fill("Latihan soal di tiap bab membantu saya memahami pola penalaran dengan lebih tenang.");
  await dialog.getByRole("button", { name: "Kirim testimoni" }).click();
  await expect(page.getByText(/Testimonimu menunggu tinjauan admin/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Kelas Penalaran Umum selesai" })).toHaveCount(0);

  const ctx = await browser.newContext({ baseURL: "http://localhost:3000" });
  const admin = await ctx.newPage();
  await masuk(admin, "admin@tamanpelajar.test", "/admin/testimoni");
  const item = admin.getByRole("listitem").filter({ hasText: opening });
  await expect(item.getByText("Menunggu tinjauan")).toBeVisible();
  await item.getByRole("button", { name: "Terbitkan" }).click();
  await expect(admin.getByText("Testimoni diterbitkan di beranda.")).toBeVisible();
  await expect(item.getByText("Tampil")).toBeVisible();
  await ctx.close();
});
