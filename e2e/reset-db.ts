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
    await prisma.voucher.deleteMany({ where: { code: { startsWith: "E2E-" } } });
    // Tryout dan soal buatan tes admin (dihapus permanen agar slug bisa dipakai lagi).
    await prisma.exam.deleteMany({ where: { slug: { startsWith: "tryout-uji-admin-" } } });
    await prisma.question.deleteMany({ where: { body: { startsWith: "Soal uji e2e" }, examQuestions: { none: {} } } });
    // Konten buatan tes admin konten (e2e/admin-konten.spec.ts).
    await prisma.product.deleteMany({ where: { slug: { startsWith: "paket-uji-admin-" } } });
    await prisma.certificate.deleteMany({ where: { course: { slug: { startsWith: "kelas-uji-admin-" } } } });
    await prisma.course.deleteMany({ where: { slug: { startsWith: "kelas-uji-admin-" } } });
    await prisma.video.deleteMany({ where: { slug: { startsWith: "video-uji-admin-" } } });
    await prisma.courseCategory.deleteMany({ where: { slug: { startsWith: "program-uji-admin-" } } });
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
      // Akun sasaran tes panel admin (M.3, C.2.6): satu pesanan menunggu pembayaran.
      const product = await prisma.product.findFirstOrThrow({ where: { status: "TERBIT", deletedAt: null }, orderBy: { name: "asc" } });
      await prisma.user.create({
        data: {
          email: `e2e-sasaran-${project}@tamanpelajar.test`,
          name: `Sasaran Admin ${project === "desktop" ? "Desktop" : "Mobile"}`,
          passwordHash,
          emailVerified: now,
          profile: { create: { phone: "081277770000", educationLevel: "SMA", examTarget: "UTBK/SNBT", completedAt: now } },
          orders: {
            create: {
              number: `TP-E2E-${project.toUpperCase()}`,
              subtotal: product.promoPrice ?? product.price,
              total: product.promoPrice ?? product.price,
              expiresAt: new Date(now.getTime() + 86_400_000),
              items: {
                create: { productId: product.id, nameSnapshot: product.name, price: product.price, promoPrice: product.promoPrice, activeDays: product.activeDays },
              },
              payments: { create: { provider: "simulasi", method: "TRANSFER_BANK" } },
            },
          },
        },
      });
      // Percobaan selesai dengan essay belum dinilai, untuk antrean penilaian (L.2.7).
      const essay = await prisma.examQuestion.findFirst({
        where: { question: { type: "ESSAY" }, exam: { deletedAt: null } },
        select: { examId: true, questionId: true },
      });
      if (essay) {
        await prisma.examAttempt.create({
          data: {
            exam: { connect: { id: essay.examId } },
            user: { connect: { email: `e2e-sasaran-${project}@tamanpelajar.test` } },
            attemptNo: 1,
            status: "SELESAI",
            seed: 1,
            startedAt: new Date(now.getTime() - 3600_000),
            deadlineAt: now,
            submittedAt: new Date(now.getTime() - 1800_000),
            answers: { create: { questionId: essay.questionId, textAnswer: `Jawaban essay uji ${project}: belajar rutin membangun kebiasaan.` } },
            result: { create: { totalScore: 0, maxScore: 0, correct: 0, wrong: 0, empty: 0, durationSec: 1800, passed: false } },
          },
        });
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

resetDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
