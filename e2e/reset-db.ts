import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Sebelum e2e: kosongkan rate limit (agar tes daftar/masuk berulang tidak terblokir) dan
 * hapus akun yang dibuat tes sebelumnya. Akun demo dari seed tidak disentuh, kecuali
 * status kunci brute force-nya direset. Akun tryout e2e (satu per project Playwright)
 * dibuat ulang dengan langganan semua paket tryout, agar jatah percobaan selalu penuh. Dijalankan lewat tsx oleh global-setup.ts karena
 * Prisma Client memakai ESM, sedangkan Playwright memuat konfigurasi sebagai CommonJS.
 */
async function resetDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi");
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
  try {
    await prisma.rateLimit.deleteMany();
    // Order tidak ikut terhapus bersama User (relasi tanpa cascade), jadi hapus lebih dulu.
    await prisma.order.deleteMany({ where: { user: { email: { startsWith: "e2e-" } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: "e2e-" } } });
    await prisma.verificationToken.deleteMany({ where: { identifier: { startsWith: "e2e-" } } });
    await prisma.user.updateMany({
      where: { email: { endsWith: "@tamanpelajar.test" } },
      data: { failedLogins: 0, lockedUntil: null },
    });

    const passwordHash = await bcrypt.hash("Demo12345!", 10);
    const products = await prisma.product.findMany({ where: { exams: { some: {} }, deletedAt: null }, select: { id: true } });
    const now = new Date();
    for (const project of ["desktop", "mobile"]) {
      // Pembeli tanpa paket untuk alur keranjang dan checkout (K).
      await prisma.user.create({
        data: {
          email: `e2e-beli-${project}@tamanpelajar.test`,
          name: `Pembeli ${project === "desktop" ? "Desktop" : "Mobile"}`,
          passwordHash,
          emailVerified: now,
          profile: { create: { phone: "081288880000", educationLevel: "UMUM", examTarget: "SKD CPNS", completedAt: now } },
        },
      });
      await prisma.user.create({
        data: {
          email: `e2e-tryout-${project}@tamanpelajar.test`,
          name: `Peserta Tryout ${project === "desktop" ? "Desktop" : "Mobile"}`,
          passwordHash,
          emailVerified: now,
          profile: { create: { phone: "081299990000", educationLevel: "SMA", examTarget: "UTBK/SNBT", completedAt: now } },
          enrollments: {
            create: products.map((p) => ({ productId: p.id, startsAt: now, expiresAt: new Date(now.getTime() + 30 * 86_400_000) })),
          },
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

resetDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
