import { execSync } from "node:child_process";

// Rute yang dikompilasi server dev saat pertama dibuka. Dibuka sekali di sini agar tes
// paralel tidak berebut kompilasi (konten streaming bisa melewati batas waktu expect).
const warmRoutes = [
  "/",
  "/masuk",
  "/program",
  "/kelas",
  "/kelas/tes-wawasan-kebangsaan",
  "/kelas/tes-wawasan-kebangsaan/aspek-yang-diuji",
  "/video",
  "/video/penalaran-umum-silogisme",
  "/tryout",
  "/tryout/tryout-skd-paket-1",
  "/tryout/hasil/pemanasan",
  "/tryout/pembahasan/pemanasan",
  "/ujian/pemanasan",
  "/dashboard",
];

export default async function globalSetup() {
  execSync("pnpm exec tsx e2e/reset-db.ts", { stdio: "inherit" });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  for (const path of warmRoutes) {
    try {
      await fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(90_000) });
    } catch {
      // Server belum siap atau rute gagal: tes yang bersangkutan akan melaporkannya.
    }
  }
}
