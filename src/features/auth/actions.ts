"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { signIn, signOut } from "@/lib/auth";
import { resetPasswordMail, sendMail, verificationMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { formatRetry, rateLimit } from "@/lib/rate-limit";
import { AuthorizationError, requireRole } from "@/lib/rbac";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { createToken, hashToken } from "@/lib/tokens";

import {
  daftarSchema,
  lengkapiProfilSchema,
  lupaPasswordSchema,
  masukSchema,
  resetPasswordSchema,
  type DaftarInput,
  type LengkapiProfilInput,
  type LupaPasswordInput,
  type MasukInput,
  type ResetPasswordInput,
} from "./schemas";

const VERIFY_HOURS = 24;
const RESET_MINUTES = 60;

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
}

async function limited(key: string, limit: number, windowSec: number) {
  const r = await rateLimit(`${key}:${await clientIp()}`, limit, windowSec);
  return r.allowed ? null : fail(`Terlalu banyak percobaan. Coba lagi dalam ${formatRetry(r.retryAfterSec)}.`);
}

async function issueVerification(user: { id: string; email: string; name: string }) {
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
  const { token, tokenHash } = createToken();
  await prisma.verificationToken.create({
    data: { identifier: user.email, tokenHash, expiresAt: new Date(Date.now() + VERIFY_HOURS * 3600_000) },
  });
  return sendMail(verificationMail(user.email, user.name, token));
}

/** Daftar akun (E.1.1, E.2). */
export async function daftar(input: DaftarInput): Promise<ActionResult<{ email: string; demoLink?: string }>> {
  const blocked = await limited("daftar", 5, 60 * 60);
  if (blocked) return blocked;
  const parsed = daftarSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) {
    return fail("Email ini sudah terdaftar.", { email: "Email sudah terdaftar. Masuk, atau pakai Lupa password." });
  }

  const user = await prisma.user.create({
    data: {
      email: d.email,
      name: d.name,
      passwordHash: await bcrypt.hash(d.password, 10),
      profile: {
        create: { phone: d.phone, educationLevel: d.educationLevel, examTarget: d.examTarget, completedAt: new Date() },
      },
    },
  });
  const { demoLink } = await issueVerification(user);
  return ok({ email: user.email, demoLink });
}

const loginMessages: Record<string, string> = {
  invalid: "Email atau password salah.",
  locked: "Akun dikunci sementara setelah 5 kali salah password. Coba lagi dalam 15 menit atau atur ulang password.",
  "rate-limited": "Terlalu banyak percobaan masuk. Tunggu 15 menit lalu coba lagi.",
  unverified: "Email belum diverifikasi. Buka tautan di email kami, atau kirim ulang dari halaman verifikasi.",
  inactive: "Akun ini dinonaktifkan. Hubungi kami lewat halaman kontak.",
};

/** Masuk dengan email dan password (E.1.2). Semua pemeriksaan keamanan ada di authorize(). */
export async function masuk(
  input: MasukInput & { callbackUrl?: string },
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = masukSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      const code = "code" in e && typeof e.code === "string" ? e.code : "invalid";
      return { ok: false, error: loginMessages[code] ?? loginMessages.invalid, code };
    }
    throw e;
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { email: parsed.data.email }, select: { role: true } });
  return ok({ redirectTo: safeCallbackUrl(input.callbackUrl, user.role === "ADMIN" ? "/admin" : "/dashboard") });
}

/** Masuk dengan Google (E.3.5). */
export async function masukGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}

export async function keluar() {
  await signOut({ redirectTo: "/" });
}

/** Lupa password (E.1.3). Jawaban selalu sama agar tidak membocorkan email yang terdaftar. */
export async function lupaPassword(input: LupaPasswordInput): Promise<ActionResult<{ demoLink?: string }>> {
  const blocked = await limited("lupa-password", 5, 60 * 60);
  if (blocked) return blocked;
  const parsed = lupaPasswordSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.deletedAt || !user.isActive) return ok({});

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const { token, tokenHash } = createToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
  });
  const { demoLink } = await sendMail(resetPasswordMail(user.email, user.name, token));
  return ok({ demoLink });
}

/** Reset password dari tautan email (E.1.4). Token sekali pakai, dan kunci akun dibuka. */
export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult<null>> {
  const blocked = await limited("reset-password", 10, 60 * 60);
  if (blocked) return blocked;
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);

  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return fail("Tautan reset sudah kedaluwarsa atau sudah dipakai. Minta tautan baru dari halaman Lupa password.");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        failedLogins: 0,
        lockedUntil: null,
        // Membuka tautan dari email sekaligus membuktikan kepemilikan email.
        emailVerified: new Date(),
      },
    }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return ok(null);
}

/** Verifikasi email dari tautan (E.1.5). Dipanggil oleh halaman verifikasi-email. */
export async function verifyEmailToken(token: string): Promise<ActionResult<{ email: string }>> {
  const row = await prisma.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.expiresAt < new Date()) {
    return fail("Tautan verifikasi tidak valid atau sudah kedaluwarsa. Kirim ulang tautan di bawah.");
  }
  await prisma.$transaction([
    prisma.user.updateMany({ where: { email: row.identifier, emailVerified: null }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.deleteMany({ where: { identifier: row.identifier } }),
  ]);
  return ok({ email: row.identifier });
}

/** Kirim ulang tautan verifikasi. Jawaban selalu sama untuk email yang tidak terdaftar. */
export async function kirimUlangVerifikasi(input: LupaPasswordInput): Promise<ActionResult<{ demoLink?: string }>> {
  const blocked = await limited("verifikasi", 5, 60 * 60);
  if (blocked) return blocked;
  const parsed = lupaPasswordSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.emailVerified) return ok({});
  const { demoLink } = await issueVerification(user);
  return ok({ demoLink });
}

/** Lengkapi profil (E.1.6), terutama untuk akun dari Google. */
export async function lengkapiProfil(
  input: LengkapiProfilInput & { callbackUrl?: string },
): Promise<ActionResult<{ redirectTo: string }>> {
  let user;
  try {
    user = await requireRole();
  } catch (e) {
    if (e instanceof AuthorizationError) return fail(e.message);
    throw e;
  }
  const parsed = lengkapiProfilSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const data = { ...parsed.data, school: parsed.data.school || null, city: parsed.data.city || null, completedAt: new Date() };
  await prisma.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  return ok({ redirectTo: safeCallbackUrl(input.callbackUrl, user.role === "ADMIN" ? "/admin" : "/dashboard") });
}
