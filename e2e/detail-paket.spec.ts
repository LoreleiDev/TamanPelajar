import { expect, test } from "@playwright/test";

test.describe("detail paket (D.3)", () => {
  test("menampilkan harga, isi paket, silabus dengan bab gratis/terkunci, dan ulasan", async ({ page }) => {
    await page.goto("/paket/persiapan-skd-cpns");
    await expect(page).toHaveTitle("Persiapan SKD CPNS 2027 | Taman Pelajar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Persiapan SKD CPNS 2027");

    const panel = page.getByRole("complementary", { name: "Pembelian" });
    await expect(panel.getByText("Rp 299.000", { exact: false })).toBeVisible();
    await expect(panel.getByText("Masa aktif 180 hari sejak pembayaran")).toBeVisible();

    await expect(page.getByRole("table", { name: "Tryout CBT" }).getByRole("row")).toHaveCount(2);
    await expect(page.getByText("Gratis setelah masuk").first()).toBeVisible();
    await expect(page.getByText("Terbuka setelah berlangganan").first()).toBeVisible();
    await expect(page.getByText("dari 1 ulasan")).toBeVisible();

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(jsonLd ?? "{}")).toMatchObject({ "@type": "Course", offers: { price: 299000, priceCurrency: "IDR" } });
  });

  test("tombol beli memunculkan dialog masuk untuk tamu", async ({ page }) => {
    await page.goto("/paket/tryout-skd-cpns", { waitUntil: "networkidle" });
    await page.getByRole("complementary", { name: "Pembelian" }).getByRole("button", { name: "Beli sekarang" }).click();
    const dialog = page.getByRole("dialog", { name: "Masuk dulu untuk melanjutkan" });
    await expect(dialog.getByRole("link", { name: "Masuk" })).toHaveAttribute(
      "href",
      "/masuk?callbackUrl=%2Fpaket%2Ftryout-skd-cpns",
    );
  });

  test("paket tanpa ulasan dan paket yang tidak ada", async ({ page }) => {
    await page.goto("/paket/persiapan-sekolah-kedinasan");
    await expect(page.getByText("Belum ada ulasan untuk paket ini.")).toBeVisible();
    const res = await page.goto("/paket/paket-yang-tidak-ada");
    expect(res?.status()).toBe(404);
  });

  test("kartu katalog membuka detail paket", async ({ page }) => {
    await page.goto("/program");
    await page.getByRole("link", { name: "Tryout UTBK/SNBT", exact: true }).click();
    await expect(page).toHaveURL(/\/paket\/tryout-utbk-snbt$/);
    await expect(page.getByRole("heading", { name: "Paket serupa" })).toBeVisible();
  });
});
