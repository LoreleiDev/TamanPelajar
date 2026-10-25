import { expect, test, type Browser, type Page } from "@playwright/test";

// Sertifikat berbasis batch + tugas praktik (revisi RMED). Peserta per project disiapkan
// reset-db.ts: semua materi Penalaran Umum selesai dan rata-rata kuis 90.
test.describe.configure({ mode: "serial" });

async function masuk(page: Page, email: string, callbackUrl: string) {
  await page.goto(`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${callbackUrl}$`));
}

const studentName = (project: string) => `Peserta Sertifikat ${project === "desktop" ? "Desktop" : "Mobile"}`;

async function asAdmin(browser: Browser, run: (admin: Page) => Promise<void>) {
  const ctx = await browser.newContext({ baseURL: "http://localhost:3000" });
  const admin = await ctx.newPage();
  await masuk(admin, "admin@tamanpelajar.test", "/admin/tugas-praktik");
  await run(admin);
  await ctx.close();
}

async function review(admin: Page, project: string, decision: "Minta revisi" | "Setujui", note?: string) {
  const card = admin.getByRole("article").filter({ hasText: studentName(project) }).filter({ has: admin.getByRole("button", { name: "Setujui" }) });
  await expect(card).toHaveCount(1);
  if (note) await card.getByLabel("Catatan untuk siswa").fill(note);
  await card.getByRole("button", { name: decision }).click();
  const confirm = admin.getByRole("dialog");
  await confirm.getByRole("button", { name: decision === "Setujui" ? "Ya, setujui" : "Minta revisi" }).click();
  await expect(admin.getByText(decision === "Setujui" ? "Tugas disetujui. Sertifikat terbit." : "Revisi diminta.")).toBeVisible();
}

test("syarat terpenuhi, kirim tugas, revisi sekali, lalu sertifikat terbit", async ({ page, browser }, info) => {
  const project = info.project.name.replace("konten-", "");
  await masuk(page, `e2e-sertif-${project}@tamanpelajar.test`, "/dashboard/sertifikat");
  const card = page.getByRole("region", { name: "Penalaran Umum" });
  await expect(card.getByText("Sedang belajar")).toBeVisible();
  await expect(card.getByRole("list", { name: "Syarat sertifikat" })).toContainText("(sekarang 90)");

  // Link selain Google Drive ditolak sebelum dikirim.
  await card.getByLabel("Link Google Drive tugas").fill("https://contoh.test/tugas");
  await card.getByRole("button", { name: "Kirim tugas praktik" }).click();
  await expect(card.getByRole("alert")).toContainText("Google Drive");

  await card.getByLabel("Link Google Drive tugas").fill(`https://drive.google.com/drive/folders/e2e-${project}-1`);
  await card.getByRole("button", { name: "Kirim tugas praktik" }).click();
  await expect(card.getByText("Menunggu penilaian").first()).toBeVisible();
  await expect(card.getByLabel("Link Google Drive tugas")).toHaveCount(0);

  await asAdmin(browser, (admin) => review(admin, project, "Minta revisi", "Tambahkan pembahasan untuk soal latihan nomor 3."));

  await page.reload();
  await expect(card.getByText("Perlu revisi").first()).toBeVisible();
  await expect(card.getByText("Tambahkan pembahasan untuk soal latihan nomor 3.")).toBeVisible();
  await card.getByLabel("Link Google Drive tugas").fill(`https://drive.google.com/drive/folders/e2e-${project}-2`);
  await card.getByRole("button", { name: "Kirim revisi" }).click();
  await expect(card.getByText("Menunggu penilaian").first()).toBeVisible();

  await asAdmin(browser, async (admin) => {
    // Revisi sudah dipakai, jadi tombolnya tidak ada lagi.
    const pending = admin.getByRole("article").filter({ hasText: studentName(project) }).filter({ has: admin.getByRole("button", { name: "Setujui" }) });
    await expect(pending.getByRole("button", { name: "Minta revisi" })).toHaveCount(0);
    await review(admin, project, "Setujui");
  });

  await page.goto("/dashboard/notifikasi");
  await expect(page.getByText("Sertifikat terbit").first()).toBeVisible();
  await page.goto("/dashboard/sertifikat");
  await page.getByRole("link", { name: "Lihat dan unduh" }).first().click();
  await expect(page).toHaveURL(/\/sertifikat\/TP-\d{4}-PEN-/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(studentName(project));
});

test("admin mengelola batch kelas dan pengaturan sertifikat", async ({ page }, info) => {
  test.skip(info.project.name.includes("mobile"), "cukup sekali di desktop");
  await masuk(page, "admin@tamanpelajar.test", "/admin/sertifikat");
  const pu = page.getByRole("region", { name: "Penalaran Umum" });
  await expect(pu.getByLabel("Nilai minimal")).toHaveValue("80");
  await pu.getByLabel("Nilai minimal").fill("150");
  await pu.getByRole("button", { name: "Simpan pengaturan" }).click();
  await expect(pu.getByText("Maksimal 100")).toBeVisible();

  await page.goto("/admin/kelas");
  await page.getByRole("link", { name: "Penalaran Umum" }).first().click();
  await page.getByRole("tab", { name: "Batch" }).click();
  const table = page.getByRole("table", { name: "Batch kelas" });
  await expect(table.getByText("Berjalan")).toBeVisible();
  await expect(table.getByText("Akan datang")).toBeVisible();

  // Batch yang tumpang tindih ditolak.
  await page.getByRole("button", { name: "Tambah batch" }).click();
  const dialog = page.getByRole("dialog", { name: "Tambah batch" });
  await dialog.getByLabel("Nama batch").fill("Batch Uji Tabrakan");
  const today = new Date().toISOString().slice(0, 10);
  await dialog.getByLabel("Tanggal mulai").fill(today);
  await dialog.getByLabel("Tanggal selesai").fill(`${Number(today.slice(0, 4)) + 1}${today.slice(4)}`);
  await dialog.getByRole("button", { name: "Simpan batch" }).click();
  await expect(dialog.getByText(/bertabrakan dengan Batch/)).toBeVisible();
});
