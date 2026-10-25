import { defineConfig, devices } from "@playwright/test";

// Browser diunduh sekali dengan: pnpm exec playwright install chromium
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  // Banyak browser sekaligus memperlambat server lokal; tiga worker cukup stabil.
  workers: process.env.CI ? 2 : 3,
  // Halaman dengan streaming data bisa lebih dari 5 detik bawaan saat beban tinggi.
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", testIgnore: /admin-konten/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", testIgnore: /admin-konten/, use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
    // Tes konten admin menerbitkan paket uji yang ikut terhitung di katalog, jadi baru
    // dijalankan setelah tes lain selesai.
    { name: "konten-desktop", testMatch: /admin-konten/, dependencies: ["desktop", "mobile"], use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "konten-mobile", testMatch: /admin-konten/, dependencies: ["desktop", "mobile"], use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
  ],
  // Bawaan: build produksi lalu `next start`. Lebih cepat dan stabil daripada server dev yang
  // mengompilasi rute saat pertama dibuka. E2E_DEV=1 memakai server dev.
  // `next` dijalankan langsung (bukan lewat pnpm) agar ikut dimatikan saat tes selesai; di
  // Windows proses anak pnpm bisa tertinggal. Server yang sudah berjalan tidak dipakai ulang
  // (kecuali E2E_REUSE=1) karena data `use cache`-nya bisa basi setelah seed ulang.
  webServer: {
    command: process.env.E2E_DEV ? "node ./node_modules/next/dist/bin/next dev" : "pnpm build && node ./node_modules/next/dist/bin/next start",
    url: "http://localhost:3000",
    reuseExistingServer: Boolean(process.env.E2E_REUSE),
    timeout: 300_000,
    // Alur checkout e2e memakai pembayaran simulasi, apa pun PAYMENT_MODE di .env.
    env: { PAYMENT_MODE: "simulasi" },
  },
});
