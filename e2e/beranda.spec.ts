import { expect, test } from "@playwright/test";

test("beranda menampilkan brand Taman Pelajar", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Taman Pelajar/);
  await expect(page.getByRole("img", { name: "Taman Pelajar" })).toBeVisible();
});
