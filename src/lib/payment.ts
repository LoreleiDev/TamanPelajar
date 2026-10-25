import { createSnapTransaction, type PaymentMethodCode, type SnapRequest, type VaBank } from "@/lib/midtrans";

// Abstraksi penyedia pembayaran (A.4, K.2). Dipilih lewat env PAYMENT_MODE=simulasi|midtrans;
// bawaan lokal dan demo: simulasi. Aktivasi paket tidak terjadi di sini, melainkan di
// features/payment/orders.ts setelah status BERHASIL.

export type PaymentMode = "simulasi" | "midtrans";

export const paymentMode = (): PaymentMode => (process.env.PAYMENT_MODE === "midtrans" ? "midtrans" : "simulasi");

export interface CreatedPayment {
  provider: PaymentMode;
  externalId: string;
  snapToken?: string;
  redirectUrl?: string;
  vaNumber?: string;
  qrString?: string;
}

export interface PaymentProvider {
  name: PaymentMode;
  createPayment(req: SnapRequest & { method: PaymentMethodCode; bank?: VaBank }): Promise<CreatedPayment>;
}

const bankPrefix: Record<VaBank, string> = { bca: "39012", bni: "98812", bri: "26215", mandiri: "89608", permata: "85012" };

/** Nomor tampilan deterministik dari nomor pesanan; hanya untuk demo, tidak bisa dipakai bayar. */
function demoDigits(orderNumber: string, length: number) {
  let h = 0;
  for (const c of orderNumber) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return String(h).padStart(length, "0").slice(-length);
}

const simulasi: PaymentProvider = {
  name: "simulasi",
  async createPayment(req) {
    const base = { provider: "simulasi" as const, externalId: `SIM-${req.orderNumber}` };
    if (req.method === "VIRTUAL_ACCOUNT") return { ...base, vaNumber: `${bankPrefix[req.bank ?? "bca"]}${demoDigits(req.orderNumber, 11)}` };
    if (req.method === "TRANSFER_BANK") return { ...base, vaNumber: `8800${demoDigits(req.orderNumber, 8)}` };
    if (req.method === "QRIS") return { ...base, qrString: `SIMULASI-QRIS-${req.orderNumber}` };
    return base;
  },
};

const midtrans: PaymentProvider = {
  name: "midtrans",
  async createPayment(req) {
    const snap = await createSnapTransaction(req);
    return { provider: "midtrans", externalId: req.orderNumber, snapToken: snap.token, redirectUrl: snap.redirectUrl };
  },
};

export function getPaymentProvider(): PaymentProvider {
  return paymentMode() === "midtrans" ? midtrans : simulasi;
}

export const PAYMENT_METHODS: { value: Exclude<PaymentMethodCode, "SIMULASI">; label: string; hint: string }[] = [
  { value: "VIRTUAL_ACCOUNT", label: "Virtual account", hint: "BCA, BNI, BRI, Mandiri, Permata" },
  { value: "QRIS", label: "QRIS", hint: "Pindai dengan aplikasi bank atau e-wallet" },
  { value: "E_WALLET", label: "E-wallet", hint: "GoPay atau ShopeePay" },
  { value: "TRANSFER_BANK", label: "Transfer bank", hint: "Transfer dari rekening bank mana pun" },
];

export const METHOD_LABELS: Record<PaymentMethodCode, string> = {
  VIRTUAL_ACCOUNT: "Virtual account",
  QRIS: "QRIS",
  E_WALLET: "E-wallet",
  TRANSFER_BANK: "Transfer bank",
  SIMULASI: "Simulasi",
};

export const BANK_LABELS: Record<VaBank, string> = { bca: "BCA", bni: "BNI", bri: "BRI", mandiri: "Mandiri", permata: "Permata" };
