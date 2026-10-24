import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Sebelum e2e: kosongkan rate limit (agar tes daftar/masuk berulang tidak terblokir) dan
 * hapus akun yang dibuat tes sebelumnya. Akun demo dari seed tidak disentuh, kecuali
 * status kunci brute force-nya direset. Dijalankan lewat tsx oleh global-setup.ts karena
 * Prisma Client memakai ESM, sedangkan Playwright memuat konfigurasi sebagai CommonJS.
 */
async function resetDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi");
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
  try {
    await prisma.rateLimit.deleteMany();
    await prisma.user.deleteMany({ where: { email: { startsWith: "e2e-" } } });
    await prisma.verificationToken.deleteMany({ where: { identifier: { startsWith: "e2e-" } } });
    await prisma.user.updateMany({
      where: { email: { endsWith: "@tamanpelajar.test" } },
      data: { failedLogins: 0, lockedUntil: null },
    });
  } finally {
    await prisma.$disconnect();
  }
}

resetDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
