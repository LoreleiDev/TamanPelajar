"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { resetPasswordMail, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/tokens";

import { adminAction, audit } from "../guard";
import { userCreateSchema, userIdSchema, userStatusSchema, userUpdateSchema } from "./schemas";

const RESET_MINUTES = 60;

/** Tambah pengguna (M.3). Email dianggap terverifikasi karena dibuat admin. */
export async function buatPengguna(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = userCreateSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { name, email, role, password } = parsed.data;
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      return fail("Email sudah terdaftar.", { email: "Email ini sudah dipakai akun lain" });
    }
    const user = await prisma.user.create({
      data: { name, email, role, passwordHash: await bcrypt.hash(password, 10), emailVerified: new Date() },
      select: { id: true },
    });
    await audit(prisma, admin, "pengguna.buat", "User", user.id, { after: { name, email, role } });
    revalidatePath("/admin/pengguna");
    return ok(user);
  });
}

/** Ubah nama, email, dan role. Admin tidak bisa menurunkan role akunnya sendiri. */
export async function ubahPengguna(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = userUpdateSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, name, email, role } = parsed.data;
    const before = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { name: true, email: true, role: true } });
    if (!before) return fail("Pengguna tidak ditemukan.");
    if (id === admin.id && role !== "ADMIN") return fail("Kamu tidak bisa mengubah role akunmu sendiri.", { role: "Minta admin lain bila perlu" });
    if (email !== before.email && (await prisma.user.findUnique({ where: { email }, select: { id: true } }))) {
      return fail("Email sudah terdaftar.", { email: "Email ini sudah dipakai akun lain" });
    }
    await prisma.user.update({
      where: { id },
      // Email baru dianggap terverifikasi karena diubah admin.
      data: { name, email, role, ...(email !== before.email && { emailVerified: new Date() }) },
    });
    await audit(prisma, admin, "pengguna.ubah", "User", id, { before, after: { name, email, role } });
    revalidatePath(`/admin/pengguna/${id}`);
    revalidatePath("/admin/pengguna");
    return ok(null);
  });
}

/** Nonaktifkan atau aktifkan akun. Akun nonaktif langsung tertolak di setiap request (lib/rbac). */
export async function aturStatusPengguna(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = userStatusSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, active } = parsed.data;
    if (id === admin.id) return fail("Kamu tidak bisa menonaktifkan akunmu sendiri.");
    const r = await prisma.user.updateMany({ where: { id, deletedAt: null }, data: { isActive: active } });
    if (r.count === 0) return fail("Pengguna tidak ditemukan.");
    await audit(prisma, admin, active ? "pengguna.aktifkan" : "pengguna.nonaktifkan", "User", id, { after: { isActive: active } });
    revalidatePath(`/admin/pengguna/${id}`);
    revalidatePath("/admin/pengguna");
    return ok(null);
  });
}

/**
 * Kirim tautan reset password ke email pengguna (M.3) dan buka kunci login. Password tidak
 * pernah dilihat atau ditentukan admin. Mode demo mengembalikan tautannya.
 */
export async function resetPasswordPengguna(input: unknown): Promise<ActionResult<{ demoLink?: string }>> {
  return adminAction(async (admin) => {
    const parsed = userIdSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const user = await prisma.user.findFirst({ where: { id: parsed.data.id, deletedAt: null }, select: { id: true, email: true, name: true } });
    if (!user) return fail("Pengguna tidak ditemukan.");
    const { token, tokenHash } = createToken();
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) } }),
      prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } }),
    ]);
    const { demoLink } = await sendMail(resetPasswordMail(user.email, user.name, token));
    await audit(prisma, admin, "pengguna.reset-password", "User", user.id);
    return ok({ demoLink });
  });
}
