import { expect, test, type Browser, type Page } from "@playwright/test";

// Alur pembelian (K, T.2, T.3, T.18). Satu pembeli per project; tes berurutan karena
// voucher per pengguna dan isi keranjang saling bergantung.
test.describe.configure({ mode: "serial" });

async function masuk(page: Page, email: string, callbackUrl = "/dashboard") {
  await page.goto(`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${callbackUrl}$`));
}

const buyer = (project: string) => `e2e-beli-${project}@tamanpelajar.test`;

async function beli(page: Page, slug: string) {
  await page.goto(`/paket/${slug}`, { waitUntil: "networkidle" });
  await page.getByRole("complementary", { name: "Pembelian" }).getByRole("button", { name: /^Beli sekarang/ }).click();
  await expect(page).toHaveURL(/\/keranjang$/);
}

async function checkout(page: Page) {
  await page.getByRole("link", { name: "Lanjut ke pembayaran" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.waitForLoadState("networkidle");
}

async function orderNumberFromUrl(page: Page) {
  await expect(page).toHaveURL(/\/transaksi\/TP-\d{8}-[A-Z0-9]+$/);
  return decodeURIComponent(page.url().split("/").pop()!);
}

async function asOtherUser(browser: Browser, path: string) {
  const ctx = await browser.newContext({ baseURL: "http://localhost:3000" });
  const p = await ctx.newPage();
  await masuk(p, "user1@tamanpelajar.test");
  await p.goto(path);
  await expect(p.getByRole("heading", { name: "Halaman ini tidak ditemukan" })).toBeVisible();
  await ctx.close();
}

test.describe("keranjang dan pembayaran (K)", () => {
  test("tamu tidak bisa membuka keranjang dan checkout", async ({ page }) => {
    await page.goto("/keranjang");
    await expect(page).toHaveURL(/\/masuk\?callbackUrl=%2Fkeranjang/);
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/masuk\?callbackUrl=%2Fcheckout/);
  });

  test("beli dengan voucher, bayar simulasi, paket aktif dan bab 3 terbuka (T.2, T.3, T.18)", async ({ page, browser }, info) => {
    test.setTimeout(180_000); // alur panjang: kelas, keranjang, checkout, invoice, dashboard, dua akun lain
    await masuk(page, buyer(info.project.name));
    // Bab 3 masih terkunci sebelum membeli.
    await page.goto("/kelas/tes-wawasan-kebangsaan/pasal-yang-sering-ditanyakan");
    await expect(page.getByRole("main").getByText("Materi ini ada di bab untuk pelanggan.")).toBeVisible();

    await beli(page, "kelas-tes-wawasan-kebangsaan");
    // Menekan beli dua kali tidak menggandakan isi keranjang.
    await beli(page, "kelas-tes-wawasan-kebangsaan");
    const cart = page.getByRole("list", { name: "Isi keranjang" });
    await expect(cart.getByRole("listitem")).toHaveCount(1);
    await expect(page.getByText("Subtotal (1 paket)")).toBeVisible();

    await checkout(page);
    const main = page.getByRole("main");
    await main.getByLabel("Kode voucher (opsional)").fill("TIDAKADA");
    await main.getByRole("button", { name: "Pakai" }).click();
    await expect(main.getByText("Kode voucher tidak ditemukan.")).toBeVisible();
    await main.getByLabel("Kode voucher (opsional)").fill("hemat10");
    await main.getByRole("button", { name: "Pakai" }).click();
    await expect(main.getByText(/HEMAT10/).first()).toBeVisible();
    const totalBox = page.getByRole("complementary", { name: "Total pembayaran" });
    await expect(totalBox).toContainText("Rp 107.100".replace(" ", " "));

    await expect(main.getByRole("button", { name: "Bayar sekarang" })).toBeDisabled();
    await main.getByText("Virtual account", { exact: true }).click();
    await main.getByLabel("Bank virtual account").selectOption("bni");
    await main.getByRole("button", { name: "Bayar sekarang" }).click();

    const number = await orderNumberFromUrl(page);
    await expect(page.getByRole("status").filter({ hasText: "Menunggu pembayaran" })).toBeVisible();
    await expect(main.getByText(/^Nomor virtual account BNI/)).toBeVisible();
    await expect(main.getByText(/^98812\d{11}$/)).toBeVisible();

    // Invoice belum lunas, lalu lunas setelah bayar (K.4).
    await main.getByRole("link", { name: "Lihat invoice" }).click();
    await expect(page).toHaveURL(new RegExp(`/invoice/${number}$`));
    await expect(page.getByRole("article")).toContainText("Belum dibayar");
    await expect(page.getByRole("article")).toContainText("HEMAT10");
    await page.getByRole("link", { name: "Kembali ke transaksi" }).click();

    await page.getByRole("button", { name: "Bayar sekarang (simulasi)" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Pembayaran berhasil" })).toBeVisible();
    await expect(main.getByText(/Kelas Tes Wawasan Kebangsaan, aktif sampai/)).toBeVisible();
    await page.goto(`/invoice/${number}`);
    await expect(page.getByRole("article")).toContainText("Lunas");

    // Paket muncul di dashboard dan bab 3 terbuka (T.3, T.18).
    await page.goto("/dashboard/kelas");
    await expect(page.getByRole("main").getByText("Kelas Tes Wawasan Kebangsaan").first()).toBeVisible();
    await page.goto("/kelas/tes-wawasan-kebangsaan/pasal-yang-sering-ditanyakan");
    await expect(page.locator("video")).toHaveCount(1);

    // Keranjang kosong setelah checkout; pesanan orang lain tidak bisa dibuka (P.1.9).
    await page.goto("/keranjang");
    await expect(page.getByRole("heading", { name: "Keranjangmu masih kosong" })).toBeVisible();
    await asOtherUser(browser, `/transaksi/${number}`);
    await asOtherUser(browser, `/invoice/${number}`);
  });

  test("voucher hanya sekali per pengguna; pesanan bisa dibatalkan atau digagalkan", async ({ page }, info) => {
    test.slow();
    await masuk(page, buyer(info.project.name));
    await beli(page, "tryout-skd-cpns");
    await checkout(page);
    const main = page.getByRole("main");
    const code = main.getByLabel("Kode voucher (opsional)");
    await code.fill("HEMAT10");
    await main.getByRole("button", { name: "Pakai" }).click();
    await expect(main.getByText("Kamu sudah memakai voucher ini.")).toBeVisible();
    await code.fill("BELAJAR25");
    await main.getByRole("button", { name: "Pakai" }).click();
    await expect(main.getByText(/minimal Rp/)).toBeVisible();

    await main.getByText("QRIS", { exact: true }).click();
    await main.getByRole("button", { name: "Bayar sekarang" }).click();
    await orderNumberFromUrl(page);
    await page.getByRole("button", { name: "Batalkan pesanan" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Ya, batalkan" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Pembayaran gagal atau dibatalkan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bayar sekarang (simulasi)" })).toHaveCount(0);

    await beli(page, "tryout-skd-cpns");
    await checkout(page);
    await main.getByText("E-wallet", { exact: true }).click();
    await main.getByRole("button", { name: "Bayar sekarang" }).click();
    await orderNumberFromUrl(page);
    await page.getByRole("button", { name: "Gagalkan pembayaran" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Pembayaran gagal atau dibatalkan" })).toBeVisible();

    await page.goto("/dashboard/transaksi");
    await expect(page.getByRole("main").getByText("Gagal").first()).toBeVisible();
  });

  test("webhook Midtrans menolak notifikasi tanpa signature yang sah", async ({ request }) => {
    const res = await request.post("/api/webhooks/midtrans", {
      data: { order_id: "TP-20261025-AAAAAA", status_code: "200", gross_amount: "1.00", transaction_status: "settlement", signature_key: "palsu" },
    });
    // 503 bila kunci server belum diisi (mode simulasi lokal), 401 bila signature salah.
    expect([401, 503]).toContain(res.status());
  });
});
