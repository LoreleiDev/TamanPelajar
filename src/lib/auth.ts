import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authConfig } from "@/auth.config";
import { masukSchema } from "@/features/auth/schemas";
import { prisma } from "@/lib/prisma";
import { isRateLimited, rateLimit } from "@/lib/rate-limit";

// Kode error dipetakan ke pesan Bahasa Indonesia di features/auth/actions.ts.
class LoginError extends CredentialsSignin {
  constructor(code: "invalid" | "locked" | "rate-limited" | "unverified" | "inactive") {
    super();
    this.code = code;
  }
}

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
// Batas percobaan GAGAL per 15 menit. Login yang berhasil tidak dihitung, agar banyak siswa
// di balik satu IP (jaringan sekolah) tidak saling memblokir.
const WINDOW_SEC = 15 * 60;
const IP_FAILURES = 30;
const EMAIL_FAILURES = 10;

/** Pemeriksaan login: rate limit, kunci brute force, akun aktif, email terverifikasi (E.3.6–E.3.7). */
async function authorize(raw: unknown, request: Request) {
  const parsed = masukSchema.safeParse(raw);
  if (!parsed.success) throw new LoginError("invalid");
  const { email, password } = parsed.data;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
  const ipKey = `masuk-gagal:ip:${ip}`;
  const emailKey = `masuk-gagal:email:${email}`;
  if ((await isRateLimited(ipKey, IP_FAILURES)) || (await isRateLimited(emailKey, EMAIL_FAILURES))) {
    throw new LoginError("rate-limited");
  }
  const recordFailure = () =>
    Promise.all([rateLimit(ipKey, IP_FAILURES, WINDOW_SEC), rateLimit(emailKey, EMAIL_FAILURES, WINDOW_SEC)]);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || !user.passwordHash) {
    // Tetap jalankan bcrypt agar waktu respons tidak membocorkan email yang terdaftar.
    await bcrypt.compare(password, "$2b$10$Sc9Vtplbh7cDfGqPEz.o8eDDpmQKJM7qb.CydW9KxFUw.H9HHgEP6");
    await recordFailure();
    throw new LoginError("invalid");
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new LoginError("locked");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await recordFailure();
    const failed = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failed >= MAX_FAILED ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    throw new LoginError(failed >= MAX_FAILED ? "locked" : "invalid");
  }
  if (!user.isActive) throw new LoginError("inactive");
  if (!user.emailVerified) throw new LoginError("unverified");

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
}

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials, request) => authorize(credentials, request),
    }),
    ...(googleEnabled ? [Google({ allowDangerousEmailAccountLinking: false })] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /** Akun Google: buat atau tautkan User berdasarkan email yang sudah diverifikasi Google (E.3.5). */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = profile?.email?.toLowerCase();
      if (!email || profile?.email_verified === false) return "/masuk?error=google";

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && (!existing.isActive || existing.deletedAt)) return "/masuk?error=nonaktif";
      const dbUser =
        existing ??
        (await prisma.user.create({
          data: {
            email,
            name: profile?.name ?? user.name ?? email.split("@")[0],
            image: typeof profile?.picture === "string" ? profile.picture : null,
            emailVerified: new Date(),
            profile: { create: {} },
          },
        }));
      await prisma.account.upsert({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: account.providerAccountId } },
        create: { userId: dbUser.id, provider: "google", providerAccountId: account.providerAccountId },
        update: {},
      });
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date(), emailVerified: dbUser.emailVerified ?? new Date() },
      });
      // Pakai id dan role dari database, bukan id Google.
      user.id = dbUser.id;
      user.role = dbUser.role;
      return true;
    },
  },
});

export { googleEnabled };
