"use server";

import { revalidatePath } from "next/cache";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "../guard";
import { voucherIdSchema, voucherSchema, voucherToggleSchema } from "./schemas";

/** Buat atau ubah voucher (C.2.7). Kode unik tanpa membedakan huruf besar/kecil. */
export async function simpanVoucher(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = voucherSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id, ...data } = parsed.data;
    const clash = await prisma.voucher.findUnique({ where: { code: data.code }, select: { id: true } });
    if (clash && clash.id !== id) return fail("Kode voucher sudah dipakai.", { code: "Kode ini sudah dipakai voucher lain" });

    if (id) {
      const before = await prisma.voucher.findUnique({ where: { id } });
      if (!before) return fail("Voucher tidak ditemukan.");
      await prisma.voucher.update({ where: { id }, data });
      await audit(prisma, admin, "voucher.ubah", "Voucher", id, { before, after: data });
      revalidatePath(`/admin/voucher/${id}`);
      revalidatePath("/admin/voucher");
      return ok({ id });
    }
    const created = await prisma.voucher.create({ data, select: { id: true } });
    await audit(prisma, admin, "voucher.buat", "Voucher", created.id, { after: data });
    revalidatePath("/admin/voucher");
    return ok(created);
  });
}

export async function aturStatusVoucher(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = voucherToggleSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    await prisma.voucher.update({ where: { id: parsed.data.id }, data: { isActive: parsed.data.active } });
    await audit(prisma, admin, parsed.data.active ? "voucher.aktifkan" : "voucher.nonaktifkan", "Voucher", parsed.data.id);
    revalidatePath("/admin/voucher");
    revalidatePath(`/admin/voucher/${parsed.data.id}`);
    return ok(null);
  });
}

/** Hapus voucher yang belum pernah dipakai; yang sudah dipakai cukup dinonaktifkan agar riwayat pesanan utuh. */
export async function hapusVoucher(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = voucherIdSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { id } = parsed.data;
    const [usages, orders] = await Promise.all([prisma.voucherUsage.count({ where: { voucherId: id } }), prisma.order.count({ where: { voucherId: id } })]);
    if (usages > 0 || orders > 0) return fail("Voucher ini sudah dipakai di pesanan. Nonaktifkan saja agar riwayat pesanan tetap utuh.");
    const before = await prisma.voucher.delete({ where: { id } });
    await audit(prisma, admin, "voucher.hapus", "Voucher", id, { before });
    revalidatePath("/admin/voucher");
    return ok(null);
  });
}
