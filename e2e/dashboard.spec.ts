import { expect, test, type Page } from "@playwright/test";

async function masuk(page: Page, email: string) {
  await page.goto("/masuk?callbackUrl=%2Fdashboard");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("dashboard siswa (F)", () => {
  test("tamu diarahkan ke halaman masuk", async ({ page }) => {
    await page.goto("/dashboard/riwayat");
    await expect(page).toHaveURL(/\/masuk\?callbackUrl=%2Fdashboard%2Friwayat/);
  });

  test("ringkasan menampilkan program, progres, grafik, dan aktivitas (F.2, F.3)", async ({ page }) => {
    await masuk(page, "user1@tamanpelajar.test");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1 })).toContainText("Nadia");
    for (const name of ["Progres belajar", "Jadwal tryout", "Aktivitas terakhir"]) {
      await expect(main.getByRole("heading", { name })).toBeVisible();
    }
    for (const name of ["Perkembangan nilai", "Penguasaan topik", "Waktu belajar per minggu"]) {
      await expect(main.getByRole("figure", { name: new RegExp(`^${name}`) })).toBeVisible();
    }
    // Setiap grafik punya tabel data sebagai alternatif teks.
    await main.getByText("Lihat tabel data").first().click();
    await expect(main.getByRole("table").first()).toBeVisible();
  });

  test("menu dashboard membuka semua halaman (F.1)", async ({ page }) => {
    test.slow(); // enam navigasi; di server dev tiap halaman dikompilasi saat pertama dibuka
    await masuk(page, "user1@tamanpelajar.test");
    const nav = page.getByRole("navigation", { name: "Menu dashboard" });
    const pages: [string, RegExp, string][] = [
      ["Kelas Saya", /\/dashboard\/kelas$/, "Kelas saya"],
      ["Tryout Saya", /\/dashboard\/tryout$/, "Tryout saya"],
      ["Riwayat Hasil", /\/dashboard\/riwayat$/, "Riwayat hasil"],
      ["Analisis Kemampuan", /\/dashboard\/analisis$/, "Analisis kemampuan"],
      ["Transaksi", /\/dashboard\/transaksi$/, "Transaksi"],
      ["Sertifikat", /\/dashboard\/sertifikat$/, "Sertifikat"],
    ];
    for (const [link, url, heading] of pages) {
      await nav.getByRole("link", { name: link }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole("main").getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
  });

  test("tautan /transaksi diarahkan ke riwayat transaksi", async ({ page }) => {
    await masuk(page, "user4@tamanpelajar.test");
    await page.goto("/transaksi");
    await expect(page).toHaveURL(/\/dashboard\/transaksi$/);
    await expect(page.getByRole("main").getByText("Menunggu pembayaran").first()).toBeVisible();
  });

  test("notifikasi bisa ditandai dibaca", async ({ page }) => {
    await masuk(page, "user2@tamanpelajar.test");
    await page.goto("/dashboard/notifikasi", { waitUntil: "networkidle" });
    const main = page.getByRole("main");
    const button = main.getByRole("button", { name: "Tandai semua dibaca" });
    if (await button.isEnabled()) await button.click();
    await expect(main.getByText("0 belum dibaca")).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test("profil disimpan dan password lama yang salah ditolak", async ({ page }) => {
    await masuk(page, "user5@tamanpelajar.test");
    await page.goto("/dashboard/profil", { waitUntil: "networkidle" });
    const main = page.getByRole("main");
    await main.getByLabel("Kota (opsional)").fill("Yogyakarta");
    await main.getByRole("button", { name: "Simpan profil" }).click();
    await expect(page.getByText("Profil disimpan.")).toBeVisible();
    await page.reload();
    await expect(main.getByLabel("Kota (opsional)")).toHaveValue("Yogyakarta");

    await main.getByLabel("Password lama").fill("SalahSekali1");
    await main.getByLabel("Password baru", { exact: true }).fill("PasswordBaru123");
    await main.getByLabel("Ulangi password baru").fill("PasswordBaru123");
    await main.getByRole("button", { name: "Ganti password" }).click();
    await expect(main.getByText("Password lama salah.").first()).toBeVisible();
  });
});
