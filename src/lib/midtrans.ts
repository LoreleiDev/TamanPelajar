import { createHash, timingSafeEqual } from "node:crypto";

// Integrasi Midtrans Snap (A.4, K.2) lewat REST API, tanpa SDK. Kunci hanya dari env.
// Daftar `enabled_payments` dan status transaksi mengikuti dokumentasi Snap; periksa
// ulang di dashboard Midtrans sebelum produksi.

export type PaymentMethodCode = "VIRTUAL_ACCOUNT" | "QRIS" | "E_WALLET" | "TRANSFER_BANK" | "SIMULASI";
export type OrderStatusCode = "MENUNGGU" | "BERHASIL" | "GAGAL" | "KEDALUWARSA" | "DIKEMBALIKAN";

export const VA_BANKS = ["bca", "bni", "bri", "mandiri", "permata"] as const;
export type VaBank = (typeof VA_BANKS)[number];

const isProduction = () => process.env.MIDTRANS_IS_PRODUCTION === "true";
const snapBase = () => (isProduction() ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");

export function midtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY);
}

/** Saluran Snap untuk metode yang dipilih pengguna. */
export function enabledPayments(method: PaymentMethodCode, bank?: VaBank): string[] {
  switch (method) {
    case "VIRTUAL_ACCOUNT":
      return [bank === "mandiri" ? "echannel" : `${bank ?? "bca"}_va`];
    case "QRIS":
      return ["other_qris"];
    case "E_WALLET":
      return ["gopay", "shopeepay"];
    case "TRANSFER_BANK":
      return ["other_va", "permata_va"];
    case "SIMULASI":
      return [];
  }
}

/** "2026-10-25 10:00:00 +0700" untuk field expiry.start_time. */
function jakartaTimestamp(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} +0700`;
}

export interface SnapRequest {
  orderNumber: string;
  total: number;
  discount: number;
  items: { id: string; name: string; price: number }[];
  customer: { name: string; email: string; phone?: string | null };
  method: PaymentMethodCode;
  bank?: VaBank;
  createdAt: Date;
  expiresAt: Date;
}

export async function createSnapTransaction(req: SnapRequest): Promise<{ token: string; redirectUrl: string }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum diisi");
  const items = req.items.map((i) => ({ id: i.id, name: i.name.slice(0, 50), price: i.price, quantity: 1 }));
  if (req.discount > 0) items.push({ id: "VOUCHER", name: "Potongan voucher", price: -req.discount, quantity: 1 });
  const body = {
    transaction_details: { order_id: req.orderNumber, gross_amount: req.total },
    item_details: items,
    customer_details: { first_name: req.customer.name.slice(0, 50), email: req.customer.email, phone: req.customer.phone ?? undefined },
    enabled_payments: enabledPayments(req.method, req.bank),
    expiry: {
      start_time: jakartaTimestamp(req.createdAt),
      unit: "minute",
      duration: Math.max(1, Math.round((req.expiresAt.getTime() - req.createdAt.getTime()) / 60_000)),
    },
    callbacks: { finish: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/transaksi/${req.orderNumber}` },
  };
  const res = await fetch(`${snapBase()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { token?: string; redirect_url?: string; error_messages?: string[] };
  if (!res.ok || !json.token || !json.redirect_url) {
    throw new Error(`Midtrans menolak transaksi: ${json.error_messages?.join("; ") ?? res.status}`);
  }
  return { token: json.token, redirectUrl: json.redirect_url };
}

/** signature_key = SHA512(order_id + status_code + gross_amount + server key). */
export function verifySignature(
  payload: { order_id?: unknown; status_code?: unknown; gross_amount?: unknown; signature_key?: unknown },
  serverKey: string,
) {
  const { order_id, status_code, gross_amount, signature_key } = payload;
  if (typeof order_id !== "string" || typeof status_code !== "string" || typeof gross_amount !== "string" || typeof signature_key !== "string") {
    return false;
  }
  const expected = createHash("sha512").update(order_id + status_code + gross_amount + serverKey).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature_key.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Status transaksi Midtrans ke status pesanan; null = abaikan (mis. challenge fraud). */
export function mapTransactionStatus(transactionStatus: string, fraudStatus?: string): OrderStatusCode | null {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "accept" || fraudStatus === undefined ? "BERHASIL" : null;
    case "settlement":
      return "BERHASIL";
    case "pending":
      return "MENUNGGU";
    case "deny":
    case "cancel":
    case "failure":
      return "GAGAL";
    case "expire":
      return "KEDALUWARSA";
    case "refund":
    case "partial_refund":
      return "DIKEMBALIKAN";
    default:
      return null;
  }
}

/** gross_amount Midtrans berbentuk "150000.00"; bandingkan sebagai rupiah bulat. */
export const grossAmountMatches = (gross: unknown, total: number) => typeof gross === "string" && Math.round(Number(gross)) === total;
