"use server";

import { revalidatePath } from "next/cache";

import { activateOrder, applyPaymentStatus } from "@/features/payment/orders";
import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit } from "../guard";
import { orderActionSchema } from "./schemas";

const auditAction = { verifikasi: "transaksi.verifikasi-manual", batalkan: "transaksi.batalkan", kembalikan: "transaksi.kembalikan-dana" } as const;
const conflict = {
  verifikasi: "Hanya pesanan yang menunggu pembayaran yang bisa diverifikasi.",
  batalkan: "Hanya pesanan yang menunggu pembayaran yang bisa dibatalkan.",
  kembalikan: "Hanya pesanan berhasil yang bisa dikembalikan dananya.",
} as const;

/**
 * Kelola pembayaran (C.2.6) lewat satu pintu perubahan status yang sama dengan webhook:
 * verifikasi manual (mis. transfer bank dicek dari mutasi) mengaktifkan paket, batalkan
 * mengembalikan kuota voucher, kembalikan dana membatalkan akses dari pesanan ini.
 */
export async function kelolaTransaksi(input: unknown): Promise<ActionResult<null>> {
  return adminAction(async (admin) => {
    const parsed = orderActionSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const { number, action } = parsed.data;
    const order = await prisma.order.findUnique({ where: { number }, select: { id: true, status: true, deletedAt: true } });
    if (!order || order.deletedAt) return fail("Transaksi tidak ditemukan.");

    const changed =
      action === "verifikasi"
        ? await activateOrder(order.id, { raw: { sumber: "verifikasi-manual-admin", adminId: admin.id } })
        : await applyPaymentStatus(order.id, action === "batalkan" ? "GAGAL" : "DIKEMBALIKAN");
    if (!changed) return fail(conflict[action]);

    await audit(prisma, admin, auditAction[action], "Order", order.id, { before: { status: order.status } });
    revalidatePath(`/admin/transaksi/${number}`);
    revalidatePath("/admin/transaksi");
    return ok(null);
  });
}
