import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Bantuan e2e: majukan waktu percobaan tryout ke masa lalu agar alur "waktu habis" bisa
 * diuji tanpa menunggu. Dipanggil dengan `pnpm exec tsx e2e/expire-attempt.ts <attemptId>`.
 */
async function main(attemptId: string) {
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });
  try {
    const past = new Date(Date.now() - 60_000);
    await prisma.examAttempt.update({ where: { id: attemptId }, data: { deadlineAt: past } });
    await prisma.examAttemptSection.updateMany({ where: { attemptId, submittedAt: null }, data: { deadlineAt: past } });
  } finally {
    await prisma.$disconnect();
  }
}

main(process.argv[2]).catch((e) => {
  console.error(e);
  process.exit(1);
});
