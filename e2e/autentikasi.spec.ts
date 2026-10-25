import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "Demo12345!";

async function masuk(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}

test.describe("autentikasi (E, C.4–C.5)", () => {
  test("daftar, verifikasi email lewat tautan demo, lalu masuk (T.1)", async ({ page }, info) => {
    const email = `e2e-${info.project.name}-${Date.now()}@tamanpelajar.test`;
    await page.goto("/daftar");
    await page.getByLabel("Nama lengkap").fill("Peserta Uji Coba");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Nomor WhatsApp").fill("081234567890");
    await page.getByLabel("Password", { exact: true }).fill("belajar2027");
    await expect(page.getByText("Lemah")).toBeVisible();
    await page.getByLabel("Ulangi password").fill("belajar2027");
    await page.getByLabel("Jenjang pendidikan").selectOption("SMA");
    await page.getByLabel("Target ujian").selectOption("UTBK/SNBT");
    await page.getByLabel(/Saya menyetujui/).check();
    await page.getByRole("button", { name: "Buat akun" }).click();

    await expect(page.getByRole("heading", { name: "Cek email untuk verifikasi" })).toBeVisible();
    await page.getByRole("link", { name: "Verifikasi email sekarang" }).click();
    await expect(page.getByRole("heading", { name: "Email terverifikasi" })).toBeVisible();

    await page.getByRole("link", { name: "Masuk sekarang" }).click();
    await masuk(page, email, "belajar2027");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toContainText("Peserta");
  });

  test("validasi form daftar menampilkan pesan per field", async ({ page }) => {
    await page.goto("/daftar");
    await page.getByRole("button", { name: "Buat akun" }).click();
    await expect(page.getByText("Nama lengkap minimal 3 karakter")).toBeVisible();
    await expect(page.getByText("Email wajib diisi")).toBeVisible();
    await expect(page.getByText(/Centang persetujuan/)).toBeVisible();
  });

  test("password salah memberi pesan jelas; password bisa ditampilkan", async ({ page }) => {
    await page.goto("/masuk");
    await page.getByLabel("Password", { exact: true }).fill("rahasia");
    await page.getByRole("button", { name: "Tampilkan password" }).click();
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
    await masuk(page, "user4@tamanpelajar.test", "salah-sekali1");
    await expect(page.getByRole("alert").filter({ hasText: "Email atau password salah." })).toBeVisible();
  });

  test("5 kali password salah mengunci akun sementara (E.3.6)", async ({ page, isMobile }) => {
    test.skip(isMobile, "cukup sekali; memakai akun user3");
    await page.goto("/masuk");
    for (let i = 0; i < 5; i++) {
      await masuk(page, "user3@tamanpelajar.test", `salah-${i}-sekali`);
      await expect(page.getByRole("alert").filter({ hasText: /salah|dikunci/ })).toBeVisible();
    }
    await expect(page.getByRole("alert").filter({ hasText: "Akun dikunci sementara" })).toBeVisible();
    // Password benar pun ditolak selama terkunci.
    await masuk(page, "user3@tamanpelajar.test");
    await expect(page.getByRole("alert").filter({ hasText: "Akun dikunci sementara" })).toBeVisible();
    await expect(page).toHaveURL(/\/masuk/);
  });

  test("halaman terlindungi mengarah ke masuk lalu kembali ke tujuan (C.5.4)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/masuk\?callbackUrl=%2Fdashboard/);
    await masuk(page, "user1@tamanpelajar.test");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toContainText("Nadia");
  });

  test("navbar menampilkan akun, notifikasi, dan bisa keluar (B.2.4–B.2.5)", async ({ page, isMobile }) => {
    test.skip(isMobile, "menu akun desktop");
    await page.goto("/masuk");
    await masuk(page, "user1@tamanpelajar.test");
    await expect(page).toHaveURL(/\/dashboard$/);
    // Jumlahnya bisa bertambah oleh tes admin yang berjalan paralel (balasan diskusi, penilaian).
    await expect(page.getByRole("link", { name: /^Notifikasi, \d+ belum dibaca$/ })).toBeVisible();
    await page.getByRole("button", { name: "Menu akun Nadia Rahmawati" }).click();
    await page.getByRole("menuitem", { name: "Keluar" }).click();
    // Konfirmasi SweetAlert sebelum keluar; Batal membiarkan sesi tetap aktif.
    const confirm = page.getByRole("dialog", { name: "Keluar dari akun?" });
    await confirm.getByRole("button", { name: "Batal" }).click();
    await expect(confirm).toBeHidden();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("button", { name: "Menu akun Nadia Rahmawati" }).click();
    await page.getByRole("menuitem", { name: "Keluar" }).click();
    await confirm.getByRole("button", { name: "Ya, keluar" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Masuk" }).first()).toBeVisible();
  });

  test("user biasa tidak bisa membuka panel admin; admin bisa", async ({ page, browser }) => {
    await page.goto("/masuk?callbackUrl=%2Fadmin");
    await masuk(page, "user2@tamanpelajar.test");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);

    // Konteks baru untuk admin: menghapus cookie bisa balapan dengan penyegaran sesi di latar.
    const adminContext = await browser.newContext({ baseURL: "http://localhost:3000" });
    const admin = await adminContext.newPage();
    await admin.goto("/masuk");
    await masuk(admin, "admin@tamanpelajar.test");
    await expect(admin).toHaveURL(/\/admin$/);
    await expect(admin.getByRole("heading", { name: "Dashboard admin" })).toBeVisible();
    await adminContext.close();
  });

  test("masuk dari dialog lalu langsung bisa membeli tanpa muat ulang halaman", async ({ page }) => {
    await page.goto("/paket/tryout-skd-cpns", { waitUntil: "networkidle" });
    const buy = () => page.getByRole("complementary", { name: "Pembelian" }).getByRole("button", { name: /^Beli sekarang/ });
    await buy().click();
    await page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" }).getByRole("link", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/masuk\?callbackUrl=/);
    await masuk(page, "user2@tamanpelajar.test");
    await expect(page).toHaveURL(/\/paket\/tryout-skd-cpns$/);
    await buy().click();
    await expect(page).toHaveURL(/\/keranjang$/);
    await expect(page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" })).toBeHidden();
  });

  test("admin tidak punya dashboard siswa dan tidak bisa membeli paket", async ({ page }) => {
    await page.goto("/masuk");
    await masuk(page, "admin@tamanpelajar.test");
    await expect(page).toHaveURL(/\/admin$/);
    for (const path of ["/dashboard", "/dashboard/profil", "/keranjang", "/checkout"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin$/);
    }
    await page.goto("/paket/tryout-skd-cpns", { waitUntil: "networkidle" });
    const panel = page.getByRole("complementary", { name: "Pembelian" });
    await expect(panel.getByRole("link", { name: /^Kelola paket/ })).toHaveAttribute("href", "/admin/produk");
    await expect(panel.getByRole("button", { name: /^Beli sekarang/ })).toHaveCount(0);
  });

  test("lupa password: tautan demo membuka form password baru", async ({ page }) => {
    await page.goto("/lupa-password");
    await page.getByLabel("Email akun").fill("user5@tamanpelajar.test");
    await page.getByRole("button", { name: "Kirim tautan reset" }).click();
    await expect(page.getByRole("heading", { name: "Cek email kamu" })).toBeVisible();
    await page.getByRole("link", { name: "Buat password baru sekarang" }).click();
    await expect(page.getByRole("heading", { name: "Buat password baru" })).toBeVisible();
    // Password tidak diganti agar akun demo tetap memakai Demo12345!.
    await page.goto("/reset-password/token-tidak-valid-sama-sekali");
    // Dibatasi ke <main>: saat streaming, salinan konten sempat berada di wadah tersembunyi.
    await expect(page.getByRole("main").getByText(/sudah kedaluwarsa atau sudah dipakai/)).toBeVisible();
  });
});
