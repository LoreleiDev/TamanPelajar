import { headers } from "next/headers";

import { Prisma } from "@/generated/prisma/client";
import { fail, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { AuthorizationError, requireRole, requireRolePage } from "@/lib/rbac";

// Penjaga panel administrator (C.4, P.1.8, P.1.10). Setiap halaman admin memanggil
// adminPage(), setiap query adminOnly(), dan setiap action berjalan di dalam adminAction()
// yang juga mengubah error yang bisa diduga menjadi pesan Bahasa Indonesia.

export type Admin = Awaited<ReturnType<typeof requireRole>>;

export const adminPage = (path: string) => requireRolePage("ADMIN", path);

/** Untuk query admin: lempar bila bukan admin (halaman sudah menyaring lebih dulu). */
export const adminOnly = () => requireRole("ADMIN");

export async function adminAction<T>(fn: (admin: Admin) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const admin = await requireRole("ADMIN");
    return await fn(admin);
  } catch (e) {
    if (e instanceof AuthorizationError) return fail(e.message);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return fail("Data dengan nilai yang sama sudah ada. Gunakan slug, kode, atau email lain.");
      if (e.code === "P2025") return fail("Data tidak ditemukan. Mungkin sudah dihapus admin lain; muat ulang halaman.");
      if (e.code === "P2003") return fail("Data ini masih dipakai di tempat lain sehingga tidak bisa dihapus.");
    }
    throw e;
  }
}

type Db = Pick<typeof prisma, "auditLog">;

/** Catat tindakan admin (P.1.10). before/after hanya field yang relevan, tanpa rahasia. */
export async function audit(
  db: Db,
  admin: { id: string },
  action: string,
  entity: string,
  entityId: string,
  change: { before?: unknown; after?: unknown } = {},
) {
  let ip: string | null = null;
  try {
    ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    // Di luar request (skrip) tidak ada header.
  }
  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action,
      entity,
      entityId,
      before: change.before === undefined ? undefined : (JSON.parse(JSON.stringify(change.before)) as Prisma.InputJsonValue),
      after: change.after === undefined ? undefined : (JSON.parse(JSON.stringify(change.after)) as Prisma.InputJsonValue),
      ip,
    },
  });
}
