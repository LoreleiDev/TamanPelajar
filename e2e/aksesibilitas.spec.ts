import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Aksesibilitas dasar (Q.1, WCAG 2.1 A/AA) dengan axe-core: halaman publik di desktop dan
// mobile, halaman siswa dan admin di desktop.

async function expectNoViolations(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const report = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(report, `Pelanggaran aksesibilitas di ${path}`).toEqual([]);
}

async function masuk(page: Page, email: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/(dashboard|admin)$/);
}

test.describe("aksesibilitas (Q.1)", () => {
  for (const path of ["/", "/program", "/paket/persiapan-skd-cpns", "/kelas/penalaran-umum", "/video", "/tryout/tryout-skd-paket-1", "/informasi", "/kontak", "/masuk", "/daftar"]) {
    test(`halaman publik ${path}`, async ({ page }) => {
      await expectNoViolations(page, path);
    });
  }

  test("halaman siswa", async ({ page, isMobile }) => {
    test.skip(isMobile, "cukup sekali di desktop");
    test.setTimeout(90_000);
    await masuk(page, "user1@tamanpelajar.test");
    for (const path of ["/dashboard", "/dashboard/analisis", "/dashboard/sertifikat", "/dashboard/transaksi", "/keranjang"]) {
      await expectNoViolations(page, path);
    }
  });

  test("halaman admin", async ({ page, isMobile }) => {
    test.skip(isMobile, "cukup sekali di desktop");
    test.setTimeout(90_000);
    await masuk(page, "admin@tamanpelajar.test");
    for (const path of ["/admin", "/admin/pengguna", "/admin/bank-soal", "/admin/tugas-praktik", "/admin/sertifikat", "/admin/laporan"]) {
      await expectNoViolations(page, path);
    }
  });
});
