import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

// Rate limit fixed window berbasis tabel RateLimit (P.1.4, E.3.7), cukup untuk serverless
// tanpa Redis. Satu pernyataan INSERT ... ON DUPLICATE KEY UPDATE membuatnya atomik:
// request bersamaan dengan kunci sama tidak saling bertabrakan (MySQL 8 dan MariaDB).

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  // Tulis dan baca dalam satu transaksi: INSERT ... ON DUPLICATE KEY UPDATE mengunci baris
  // sampai commit, jadi setiap request membaca hitungannya sendiri, bukan milik request lain.
  // count diperbarui lebih dulu; kedua kondisi membaca resetAt lama karena resetAt diubah sesudahnya.
  const row = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO \`RateLimit\` (id, \`key\`, count, resetAt, createdAt, updatedAt)
      VALUES (${randomUUID()}, ${key}, 1, ${resetAt}, ${now}, ${now})
      ON DUPLICATE KEY UPDATE
        count = IF(resetAt <= ${now}, 1, count + 1),
        resetAt = IF(resetAt <= ${now}, ${resetAt}, resetAt),
        updatedAt = ${now}`;
    return tx.rateLimit.findUniqueOrThrow({ where: { key } });
  });
  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSec: Math.max(0, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

/** Cek tanpa menambah hitungan: apakah kunci sudah mencapai batas di jendela berjalan. */
export async function isRateLimited(key: string, limit: number): Promise<boolean> {
  const row = await prisma.rateLimit.findUnique({ where: { key }, select: { count: true, resetAt: true } });
  return Boolean(row && row.resetAt > new Date() && row.count >= limit);
}

export function formatRetry(sec: number) {
  return sec >= 60 ? `${Math.ceil(sec / 60)} menit` : `${sec} detik`;
}
