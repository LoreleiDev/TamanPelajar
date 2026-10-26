"use client";

import { Landmark, QrCode, Ticket, Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SummaryPanel } from "@/components/shared/page-header";
import { buatPesanan, cekVoucher } from "@/features/payment/actions";
import { formatRupiah } from "@/lib/format";
import type { PaymentMethodCode, VaBank } from "@/lib/midtrans";
import { cn } from "@/lib/utils";

type Method = Exclude<PaymentMethodCode, "SIMULASI">;
const icons = { VIRTUAL_ACCOUNT: Landmark, QRIS: QrCode, E_WALLET: Wallet, TRANSFER_BANK: Landmark } as const;

/**
 * Langkah voucher, periksa pesanan, dan pilih metode (K.1–K.2). Harga dihitung ulang di
 * server; total di sini hanya pratinjau dan dikirim untuk mendeteksi perubahan harga.
 */
export function CheckoutForm({
  subtotal,
  methods,
  banks,
  simulation,
}: {
  subtotal: number;
  methods: { value: Method; label: string; hint: string }[];
  banks: { value: VaBank; label: string }[];
  simulation: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [voucherError, setVoucherError] = useState<string>();
  const [method, setMethod] = useState<Method | null>(null);
  const [bank, setBank] = useState<VaBank | "">("");
  const [error, setError] = useState<string>();
  const [checking, startChecking] = useTransition();
  const [paying, startPaying] = useTransition();
  const ids = { code: useId(), bank: useId(), methods: useId() };

  const discount = voucher?.discount ?? 0;
  const total = subtotal - discount;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-8">
        <section aria-labelledby="voucher-judul" className="flex flex-col gap-3">
          <h2 id="voucher-judul" className="text-heading">
            Voucher
          </h2>
          {voucher ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent px-4 py-3">
              <p className="flex items-center gap-2">
                <Ticket aria-hidden="true" className="size-5 text-primary" />
                <span>
                  <strong>{voucher.code}</strong> dipakai: {voucher.description}. Hemat {formatRupiah(voucher.discount)}.
                </span>
              </p>
              <Button variant="ghost" size="sm" onClick={() => setVoucher(null)}>
                <X aria-hidden="true" data-icon="inline-start" />
                Lepas voucher
              </Button>
            </div>
          ) : (
            <form
              className="flex max-w-md flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                startChecking(async () => {
                  setVoucherError(undefined);
                  const r = await cekVoucher({ code });
                  if (!r.ok) return setVoucherError(r.fieldErrors?.code ?? r.error);
                  setVoucher(r.data);
                  toast.success(`Voucher ${r.data.code} dipakai.`);
                });
              }}
            >
              <label htmlFor={ids.code} className="font-semibold">
                Kode voucher (opsional)
              </label>
              <div className="flex gap-2">
                <Input
                  id={ids.code}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  autoComplete="off"
                  maxLength={40}
                  aria-invalid={Boolean(voucherError)}
                  aria-describedby={voucherError ? `${ids.code}-error` : undefined}
                  className="uppercase"
                />
                <Button type="submit" variant="outline" disabled={checking || code.trim() === ""}>
                  {checking ? "Memeriksa…" : "Pakai"}
                </Button>
              </div>
              {voucherError && (
                <p id={`${ids.code}-error`} className="text-sm font-semibold text-destructive" role="alert">
                  {voucherError}
                </p>
              )}
            </form>
          )}
        </section>

        <section aria-labelledby="metode-judul" className="flex flex-col gap-3">
          <h2 id="metode-judul" className="text-heading">
            Metode pembayaran
          </h2>
          {simulation && (
            <p className="rounded-lg bg-secondary px-4 py-3 text-sm">
              Mode demo: semua metode memakai simulasi. Kamu bisa menandai pembayaran berhasil atau gagal di langkah berikutnya;
              tidak ada uang yang ditarik.
            </p>
          )}
          <fieldset aria-describedby={ids.methods} className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Pilih metode pembayaran</legend>
            {methods.map((m) => {
              const Icon = icons[m.value];
              const checked = method === m.value;
              return (
                <label
                  key={m.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors duration-150",
                    "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    checked ? "border-primary bg-accent" : "border-border hover:border-primary/50",
                  )}
                >
                  <input type="radio" name="metode" value={m.value} checked={checked} onChange={() => setMethod(m.value)} className="sr-only" />
                  <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="flex flex-col">
                    <span className="font-bold">{m.label}</span>
                    <span className="text-sm text-muted-foreground">{m.hint}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          <p id={ids.methods} className="sr-only">
            Metode menentukan cara bayar di langkah berikutnya.
          </p>
          {method === "VIRTUAL_ACCOUNT" && (
            <div className="flex max-w-xs flex-col gap-2">
              <label htmlFor={ids.bank} className="font-semibold">
                Bank virtual account
              </label>
              <select
                id={ids.bank}
                value={bank}
                onChange={(e) => setBank(e.target.value as VaBank)}
                className="h-10 rounded-lg border border-input bg-background px-3"
              >
                <option value="" disabled>
                  Pilih bank
                </option>
                {banks.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>
      </div>

      <SummaryPanel title="Total pembayaran" titleId="total-judul">
        <dl className="flex flex-col gap-2 tabular-nums">
          <div className="flex justify-between gap-4">
            <dt>Subtotal</dt>
            <dd>{formatRupiah(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between gap-4">
              <dt>Potongan voucher</dt>
              <dd>−{formatRupiah(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-3 text-lg font-extrabold">
            <dt>Total</dt>
            <dd>{formatRupiah(total)}</dd>
          </div>
        </dl>
        {error && (
          <p className="text-sm font-semibold text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button
          size="lg"
          disabled={paying || !method || (method === "VIRTUAL_ACCOUNT" && !bank)}
          onClick={() =>
            startPaying(async () => {
              setError(undefined);
              const r = await buatPesanan({
                voucherCode: voucher?.code ?? null,
                method,
                bank: method === "VIRTUAL_ACCOUNT" ? bank : undefined,
                expectedTotal: total,
              });
              if (!r.ok) {
                setError(r.error);
                router.refresh();
                return;
              }
              router.push(`/transaksi/${r.data.number}`);
            })
          }
        >
          {paying ? "Membuat pesanan…" : "Bayar sekarang"}
        </Button>
        {!method && <p className="text-sm text-muted-foreground">Pilih metode pembayaran untuk melanjutkan.</p>}
        <p className="text-sm text-muted-foreground">Batas pembayaran 24 jam. Paket aktif otomatis setelah pembayaran terverifikasi.</p>
      </SummaryPanel>
    </div>
  );
}
