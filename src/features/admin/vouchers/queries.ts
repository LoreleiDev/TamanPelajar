import { prisma } from "@/lib/prisma";

import { adminOnly } from "../guard";
import { voucherState } from "./schemas";

/** Semua voucher beserta pemakaian (C.2.7). Jumlahnya kecil, jadi tanpa pagination. */
export async function listVouchers() {
  await adminOnly();
  const rows = await prisma.voucher.findMany({
    orderBy: [{ isActive: "desc" }, { endsAt: "desc" }],
    include: { _count: { select: { usages: true } } },
  });
  const now = new Date();
  return rows.map(({ _count, ...v }) => ({ ...v, used: _count.usages, state: voucherState(v, _count.usages, now) }));
}

export async function getVoucher(id: string) {
  await adminOnly();
  const v = await prisma.voucher.findUnique({
    where: { id },
    include: {
      _count: { select: { usages: true } },
      usages: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, createdAt: true, user: { select: { id: true, name: true } }, order: { select: { number: true, discount: true, status: true } } },
      },
    },
  });
  return v;
}
