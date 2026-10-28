import { expect, test, type Page } from "@playwright/test";

// Panel administrator batch dasar (M.2, M.3, C.2.6, C.2.7, P.1.10, T.13). Satu akun
// sasaran dan satu pesanan per project (e2e/reset-db.ts); tes berurutan karena saling bergantung.
test.describe.configure({ mode: "serial" });

async function masuk(page: Page, email: string, callbackUrl: string) {
  await page.goto(`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${callbackUrl}$`));
}

const masukAdmin = (page: Page, path = "/admin") => masuk(page, "admin@tamanpelajar.test", path);
const sasaran = (project: string) => `e2e-sasaran-${project}@tamanpelajar.test`;

async function bukaSasaran(page: Page, project: string) {
  await page.goto(`/admin/pengguna?q=${encodeURIComponent(sasaran(project))}`);
  await page.getByRole("table", { name: "Daftar pengguna" }).getByRole("link", { name: /^Sasaran Admin/ }).click();
  await expect(page).toHaveURL(/\/admin\/pengguna\/[a-z0-9]{20,}$/);
}

test.describe("panel admin (M)", () => {
  test("siswa tidak bisa membuka panel admin (C.4)", async ({ page }) => {
    await masuk(page, "user1@tamanpelajar.test", "/dashboard");
    await page.goto("/admin/pengguna");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("dashboard admin menampilkan statistik dan grafik (M.2)", async ({ page }) => {
    await masukAdmin(page);
    await expect(page.getByRole("heading", { name: "Dashboard admin", level: 1 })).toBeVisible();
    // Dibatasi ke <main>: saat streaming, salinan konten sempat berada di wadah tersembunyi.
    await expect(page.getByRole("main").getByText("Total siswa")).toBeVisible();
    await expect(page.getByRole("figure", { name: "Pendapatan bulanan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Program terlaris" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tingkat penyelesaian kelas" })).toBeVisible();
  });

  test("ubah, nonaktifkan, aktifkan, dan reset password pengguna (M.3)", async ({ page, browser }, info) => {
    test.setTimeout(120_000);
    await masukAdmin(page, "/admin/pengguna");
    await bukaSasaran(page, info.project.name);

    await page.getByLabel("Nama lengkap").fill(`Sasaran Admin ${info.project.name} Diubah`);
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Data pengguna disimpan.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: `Sasaran Admin ${info.project.name} Diubah` })).toBeVisible();

    // Sesi yang sudah masuk sebelum akun dinonaktifkan (cookie jadi basi).
    const staleCtx = await browser.newContext({ baseURL: "http://localhost:3000" });
    const stale = await staleCtx.newPage();
    await stale.goto("/masuk?callbackUrl=%2Fdashboard");
    await stale.getByLabel("Email").fill(sasaran(info.project.name));
    await stale.getByLabel("Password", { exact: true }).fill("Demo12345!");
    await stale.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(stale).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: "Nonaktifkan akun" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Nonaktifkan" }).click();
    await expect(page.getByText("Akun nonaktif", { exact: true })).toBeVisible();

    // Cookie basi dihapus: tidak ada loop /masuk ⇄ /dashboard, halaman masuk tampil dengan pesan.
    await stale.goto("/dashboard");
    await expect(stale).toHaveURL(/\/masuk\?callbackUrl=%2Fdashboard&sesi=berakhir$/);
    await expect(stale.getByRole("alert").filter({ hasText: "Sesimu sudah tidak berlaku" })).toBeVisible();
    await stale.goto("/masuk");
    await expect(stale.getByRole("heading", { level: 1, name: "Masuk" })).toBeVisible();
    await staleCtx.close();

    // Akun nonaktif tidak bisa masuk.
    const ctx = await browser.newContext({ baseURL: "http://localhost:3000" });
    const p = await ctx.newPage();
    await p.goto("/masuk");
    await p.getByLabel("Email").fill(sasaran(info.project.name));
    await p.getByLabel("Password", { exact: true }).fill("Demo12345!");
    await p.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(p.getByRole("alert")).toBeVisible();
    await expect(p).toHaveURL(/\/masuk/);
    await ctx.close();

    await page.getByRole("button", { name: "Aktifkan akun" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Aktifkan" }).click();
    await expect(page.getByText("Akun aktif", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Kirim tautan reset password" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Kirim tautan" }).click();
    await expect(page.getByRole("link", { name: /\/reset-password\// })).toBeVisible();
  });

  test("tambah pengguna baru (M.3)", async ({ page }, info) => {
    await masukAdmin(page, "/admin/pengguna");
    await page.getByRole("button", { name: "Tambah pengguna" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nama lengkap").fill("Pengguna Baru E2E");
    await dialog.getByLabel("Email").fill(`e2e-baru-${info.project.name}@tamanpelajar.test`);
    await dialog.getByLabel("Password awal").fill("Rahasia123");
    // Email yang sudah dipakai ditolak dengan pesan di field.
    await dialog.getByLabel("Email").fill("user1@tamanpelajar.test");
    await dialog.getByRole("button", { name: "Simpan pengguna" }).click();
    await expect(dialog.getByText("Email ini sudah dipakai akun lain")).toBeVisible();
    await dialog.getByLabel("Email").fill(`e2e-baru-${info.project.name}@tamanpelajar.test`);
    await dialog.getByRole("button", { name: "Simpan pengguna" }).click();
    await expect(page).toHaveURL(/\/admin\/pengguna\/[a-z0-9]{20,}$/);
    await expect(page.getByRole("heading", { level: 1, name: "Pengguna Baru E2E" })).toBeVisible();
  });

  test("verifikasi pembayaran manual lalu kembalikan dana (C.2.6)", async ({ page }, info) => {
    const number = `TP-E2E-${info.project.name.toUpperCase()}`;
    await masukAdmin(page, "/admin/transaksi");
    await page.goto(`/admin/transaksi?q=${number}`);
    await page.getByRole("table", { name: "Daftar transaksi" }).getByRole("link", { name: number }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/transaksi/${number}$`));
    await expect(page.getByRole("status")).toHaveText(/Menunggu pembayaran/);

    await page.getByRole("button", { name: "Verifikasi pembayaran" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Ya, sudah dibayar" }).click();
    await expect(page.getByRole("status")).toHaveText(/Berhasil/);
    await expect(page.getByRole("heading", { name: "Akses dari pesanan ini" })).toBeVisible();
    await expect(page.getByText("Verifikasi pembayaran manual")).toBeVisible();

    await page.getByRole("button", { name: "Tandai dana dikembalikan" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Tandai dikembalikan" }).click();
    await expect(page.getByRole("status")).toHaveText(/Dikembalikan/);
    await expect(page.getByText("Dibatalkan", { exact: true })).toBeVisible();
  });

  test("buat, nonaktifkan, dan hapus voucher (C.2.7)", async ({ page }, info) => {
    const code = `E2E-${info.project.name.toUpperCase()}`;
    await masukAdmin(page, "/admin/voucher");
    await page.getByRole("link", { name: "Buat voucher" }).click();
    await expect(page).toHaveURL(/\/admin\/voucher\/baru$/);
    await page.getByLabel("Kode").fill(code.toLowerCase());
    await page.getByLabel("Keterangan").fill("Voucher uji otomatis");
    // Persen di atas 100 ditolak.
    await page.getByLabel("Nilai (%)").fill("150");
    await page.getByRole("button", { name: "Buat voucher" }).click();
    await expect(page.getByText("Potongan persen maksimal 100")).toBeVisible();
    await page.getByLabel("Nilai (%)").fill("15");
    await page.getByRole("button", { name: "Buat voucher" }).click();
    await expect(page).toHaveURL(/\/admin\/voucher\/[a-z0-9]{20,}$/);
    await expect(page.getByRole("heading", { level: 1, name: code })).toBeVisible();

    await page.getByRole("button", { name: "Nonaktifkan" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Nonaktifkan" }).click();
    await expect(page.getByText("Nonaktif", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Hapus voucher" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus" }).click();
    await expect(page).toHaveURL(/\/admin\/voucher$/);
    await expect(page.getByRole("link", { name: code })).toHaveCount(0);
  });

  test("buat soal, pratinjau, duplikasi, lalu hapus (M.5)", async ({ page }, info) => {
    const body = `Soal uji e2e ${info.project.name}: ibu kota Indonesia adalah …`;
    await masukAdmin(page, "/admin/bank-soal");
    await page.getByRole("link", { name: "Tambah soal" }).click();
    await expect(page).toHaveURL(/\/admin\/bank-soal\/baru$/);
    await page.getByRole("combobox", { name: "Mata pelajaran" }).fill("Pengetahuan Umum");
    await page.getByRole("combobox", { name: "Topik" }).fill("Geografi");
    await page.getByLabel("Isi pertanyaan").fill(body);
    await page.getByLabel("Opsi A", { exact: true }).fill("Bandung");
    await page.getByLabel("Opsi B", { exact: true }).fill("Jakarta");
    // Tanpa kunci jawaban ditolak.
    await page.getByRole("textbox", { name: "Pembahasan", exact: true }).fill("Ibu kota negara saat ini Jakarta.");
    await page.getByRole("button", { name: "Buat soal" }).click();
    await expect(page.getByText("Tandai tepat satu jawaban benar")).toBeVisible();
    await page.getByRole("radio").nth(1).check();
    await page.getByRole("button", { name: "Buat soal" }).click();
    await expect(page).toHaveURL(/\/admin\/bank-soal\/[a-z0-9]{20,}$/);

    await page.getByRole("tab", { name: "Pratinjau" }).click();
    await expect(page.getByRole("tabpanel").getByText(body)).toBeVisible();
    await expect(page.getByRole("tabpanel").getByText("Kunci", { exact: true })).toBeVisible();

    const original = page.url();
    await page.getByRole("button", { name: "Duplikasi" }).click();
    await expect(page.getByText("Salinan soal dibuat sebagai draf.")).toBeVisible();
    await expect(page).not.toHaveURL(original);
    await expect(page.getByText("Draf", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Hapus soal" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus soal" }).click();
    await expect(page).toHaveURL(/\/admin\/bank-soal$/);
  });

  test("buat tryout, tambah subtes dan soal, pratinjau (M.6)", async ({ page }, info) => {
    test.setTimeout(120_000);
    const title = `Tryout Uji Admin ${info.project.name}`;
    await masukAdmin(page, "/admin/tryout");
    await page.getByRole("link", { name: "Buat tryout" }).click();
    await page.getByLabel("Nama tryout").fill(title);
    await page.getByLabel("Nama tryout").blur();
    await expect(page.getByLabel("Slug URL")).toHaveValue(`tryout-uji-admin-${info.project.name}`);
    await page.getByLabel("Deskripsi").fill("Tryout untuk menguji panel admin secara otomatis.");
    await page.getByRole("button", { name: "Buat tryout" }).click();
    await expect(page).toHaveURL(/\/admin\/tryout\/[a-z0-9]{20,}\?tab=soal$/);

    await page.getByRole("button", { name: "Tambah subtes" }).click();
    await page.getByRole("dialog").getByLabel("Nama subtes").fill("Bagian Uji");
    await page.getByRole("dialog").getByRole("button", { name: "Simpan subtes" }).click();
    await expect(page.getByRole("heading", { name: "1. Bagian Uji" })).toBeVisible();

    await page.getByRole("button", { name: "Tambah soal" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("checkbox").first()).toBeVisible();
    await dialog.getByRole("checkbox").nth(0).check();
    await dialog.getByRole("checkbox").nth(1).check();
    await dialog.getByRole("button", { name: "Tambahkan 2 soal" }).click();
    await expect(page.getByText("2 soal ditambahkan ke Bagian Uji.")).toBeVisible();
    await expect(page.getByRole("list", { name: "Soal subtes Bagian Uji" }).getByRole("listitem")).toHaveCount(2);

    await page.getByRole("link", { name: "Pratinjau" }).click();
    await expect(page.getByRole("heading", { name: `Pratinjau: ${title}` })).toBeVisible();
    await expect(page.getByText("Soal 2", { exact: true })).toBeVisible();

    // Bersihkan: hapus tryout uji.
    await page.goBack();
    await page.getByRole("button", { name: "Hapus", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus tryout" }).click();
    await expect(page).toHaveURL(/\/admin\/tryout$/);
  });

  test("nilai essay dan hasil dihitung ulang (L.2.7)", async ({ page }, info) => {
    await masukAdmin(page, "/admin/penilaian");
    const card = page.getByRole("article").filter({ hasText: `Jawaban essay uji ${info.project.name}` }).first();
    await expect(card).toBeVisible();
    await card.getByLabel(/^Nilai/).fill("999");
    await card.getByRole("button", { name: "Simpan nilai" }).click();
    await expect(card.getByText(/Maksimal/)).toBeVisible();
    await card.getByLabel(/^Nilai/).fill("1");
    await card.getByRole("button", { name: "Simpan nilai" }).click();
    await expect(page.getByText("Nilai disimpan dan hasil siswa diperbarui.")).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: `Jawaban essay uji ${info.project.name}` }).getByText(/Dinilai Admin/)).toBeVisible();
  });

  test("audit log mencatat tindakan admin (P.1.10)", async ({ page }) => {
    await masukAdmin(page, "/admin/audit-log");
    await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
    await page.goto("/admin/audit-log?q=pengguna.ubah");
    await expect(page.getByText("pengguna.ubah").first()).toBeVisible();
    await page.goto("/admin/audit-log?entity=Order");
    await expect(page.getByText("transaksi.verifikasi-manual").first()).toBeVisible();
  });
});
