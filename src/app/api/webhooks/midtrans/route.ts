import { NextResponse } from "next/server";

import { applyPaymentStatus } from "@/features/payment/orders";
import { grossAmountMatches, mapTransactionStatus, verifySignature } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";

// Notifikasi pembayaran Midtrans (K.1 "verifikasi otomatis", A.4). Signature SHA512 wajib
// cocok dan nominal harus sama dengan total pesanan sebelum status diubah. Aktivasi paket
// tetap lewat applyPaymentStatus() yang idempoten, jadi notifikasi ulang aman.

export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return NextResponse.json({ error: "Midtrans belum dikonfigurasi" }, { status: 503 });

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }
  if (!verifySignature(payload, serverKey)) return NextResponse.json({ error: "Signature tidak valid" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { number: String(payload.order_id) },
    select: { id: true, total: true, payments: { orderBy: { createdAt: "desc" }, take: 1, select: { provider: true } } },
  });
  // 200 agar Midtrans tidak mengulang notifikasi untuk pesanan yang memang tidak ada di sini.
  if (!order) return NextResponse.json({ ok: true, ignored: "pesanan tidak ditemukan" });
  if (order.payments[0]?.provider !== "midtrans") return NextResponse.json({ ok: true, ignored: "bukan pembayaran Midtrans" });
  if (!grossAmountMatches(payload.gross_amount, order.total)) {
    console.error("Nominal webhook Midtrans tidak cocok", payload.order_id, payload.gross_amount);
    return NextResponse.json({ error: "Nominal tidak cocok" }, { status: 400 });
  }

  const status = mapTransactionStatus(String(payload.transaction_status ?? ""), typeof payload.fraud_status === "string" ? payload.fraud_status : undefined);
  const raw = {
    transaction_status: payload.transaction_status ?? null,
    payment_type: payload.payment_type ?? null,
    transaction_id: payload.transaction_id ?? null,
    settlement_time: payload.settlement_time ?? null,
  };
  if (status) await applyPaymentStatus(order.id, status, { from: ["MENUNGGU", "KEDALUWARSA", "GAGAL"], raw });
  return NextResponse.json({ ok: true });
}
