import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// RBAC lapis kedua (C.4, P.1.8): dipanggil di setiap action dan query sensitif, di samping
// proxy.ts. Status akun dibaca ulang dari database agar akun yang dinonaktifkan langsung terkunci.

export type Role = "ADMIN" | "USER";

export class AuthorizationError extends Error {}

/** Sekali per request: panel admin memanggilnya di layout, halaman, dan setiap query. */
export const currentUser = cache(async () => {
  // auth() memakai crypto sebelum membaca cookie; tandai dinamis lebih dulu (cacheComponents).
  await connection();
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true, isActive: true, deletedAt: true },
  });
  if (!user || !user.isActive || user.deletedAt) return null;
  return user;
});

/**
 * Untuk halaman: alihkan tamu ke halaman masuk dengan callbackUrl. Bila cookie sesi ada tetapi
 * akunnya sudah tidak ada atau nonaktif, hapus cookie itu lebih dulu agar tidak terjadi loop
 * pengalihan antara /masuk dan halaman ini.
 */
export async function requireUserPage(callbackUrl: string) {
  const user = await currentUser();
  if (!user) {
    const stale = Boolean((await auth())?.user?.id);
    const target = encodeURIComponent(callbackUrl);
    redirect(stale ? `/api/sesi/reset?callbackUrl=${target}` : `/masuk?callbackUrl=${target}`);
  }
  return user;
}

/**
 * Untuk halaman khusus role tertentu. Role lain mendapat 404 agar keberadaan halaman
 * tidak terbaca (forbidden() masih eksperimental di Next 16).
 */
export async function requireRolePage(role: Role, callbackUrl: string) {
  const user = await requireUserPage(callbackUrl);
  if (user.role !== role) notFound();
  return user;
}

/** Untuk server action: lempar error yang ditangkap action dan diubah menjadi pesan. */
export async function requireRole(role?: Role) {
  const user = await currentUser();
  if (!user) throw new AuthorizationError("Sesi berakhir. Masuk lagi untuk melanjutkan.");
  if (role && user.role !== role) throw new AuthorizationError("Kamu tidak punya akses untuk tindakan ini.");
  return user;
}

/** Pastikan resource milik user yang sedang masuk (P.1.9). Admin boleh mengakses semua. */
export function requireOwnership(user: { id: string; role: Role }, ownerId: string) {
  if (user.role !== "ADMIN" && user.id !== ownerId) {
    throw new AuthorizationError("Data ini bukan milik akunmu.");
  }
}
