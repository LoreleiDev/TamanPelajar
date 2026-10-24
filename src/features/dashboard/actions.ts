"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { formatRetry, rateLimit } from "@/lib/rate-limit";
import { AuthorizationError, requireRole } from "@/lib/rbac";

import { gantiPasswordSchema, profilSchema, type GantiPasswordInput, type ProfilInput } from "./schemas";

async function userOrFail() {
  try {
    return { user: await requireRole() };
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) };
    throw e;
  }
}

/** Tandai notifikasi dibaca: satu (id) atau semua. Hanya milik pengguna sendiri (P.1.9). */
export async function bacaNotifikasi(input: { id?: string }): Promise<ActionResult<null>> {
  const g = await userOrFail();
  if (g.error) return g.error;
  const parsed = z.object({ id: z.string().max(40).optional() }).safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  await prisma.notification.updateMany({
    where: { userId: g.user.id, readAt: null, ...(parsed.data.id ? { id: parsed.data.id } : {}) },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard", "layout");
  return ok(null);
}

/** Ubah profil (F.1 Profil). */
export async function simpanProfil(input: ProfilInput): Promise<ActionResult<null>> {
  const g = await userOrFail();
  if (g.error) return g.error;
  const parsed = profilSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const { name, ...p } = parsed.data;
  const profile = { ...p, school: p.school || null, city: p.city || null, completedAt: new Date() };
  await prisma.$transaction([
    prisma.user.update({ where: { id: g.user.id }, data: { name } }),
    prisma.profile.upsert({ where: { userId: g.user.id }, create: { userId: g.user.id, ...profile }, update: profile }),
  ]);
  revalidatePath("/dashboard", "layout");
  return ok(null);
}

/** Ganti password. Akun Google tanpa password bisa membuat password pertama. */
export async function gantiPassword(input: GantiPasswordInput): Promise<ActionResult<null>> {
  const g = await userOrFail();
  if (g.error) return g.error;
  const limit = await rateLimit(`ganti-password:${g.user.id}`, 5, 15 * 60);
  if (!limit.allowed) return fail(`Terlalu banyak percobaan. Coba lagi dalam ${formatRetry(limit.retryAfterSec)}.`);
  const parsed = gantiPasswordSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: g.user.id }, select: { passwordHash: true } });
  if (user.passwordHash) {
    const valid = await bcrypt.compare(parsed.data.currentPassword ?? "", user.passwordHash);
    if (!valid) return fail("Password lama salah.", { currentPassword: "Password lama salah." });
  }
  await prisma.user.update({ where: { id: g.user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) } });
  return ok(null);
}
