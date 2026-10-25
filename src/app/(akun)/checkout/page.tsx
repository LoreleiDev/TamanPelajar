import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getCart } from "@/features/cart/queries";
import { formatRupiah } from "@/lib/format";
import { VA_BANKS } from "@/lib/midtrans";
import { BANK_LABELS, PAYMENT_METHODS, paymentMode } from "@/lib/payment";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function Content() {
  const user = await requireUserPage("/checkout");
  const cart = await getCart(user.id);
  if (cart.items.length === 0 || cart.items.some((i) => !i.available)) redirect("/keranjang");
  return (
    <>
      <section aria-labelledby="pesanan-judul" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="pesanan-judul" className="text-heading">
            Periksa pesanan
          </h2>
          <Link href="/keranjang" className="text-sm font-semibold text-primary hover:underline">
            Ubah keranjang
          </Link>
        </div>
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" /* taste-skill-ignore: daftar pesanan padat */>
          {cart.items.map((i) => (
            <li key={i.productId} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
              <span>
                <span className="font-semibold">{i.name}</span>
                <span className="block text-sm text-muted-foreground tabular-nums">Masa aktif {i.activeDays} hari</span>
              </span>
              <span className="tabular-nums">
                {i.payPrice < i.price && <s className="mr-2 text-sm text-muted-foreground">{formatRupiah(i.price)}</s>}
                <span className="font-bold">{formatRupiah(i.payPrice)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <CheckoutForm
        subtotal={cart.subtotal}
        methods={PAYMENT_METHODS}
        banks={VA_BANKS.map((b) => ({ value: b, label: BANK_LABELS[b] }))}
        simulation={paymentMode() === "simulasi"}
      />
    </>
  );
}

// Checkout (K.1–K.2): periksa pesanan, voucher, metode, bayar.
export default function CheckoutPage() {
  return (
    <main className="page-container flex flex-col gap-8 py-10 md:py-14">
      <h1 className="text-title text-primary">Checkout</h1>
      <Suspense
        fallback={
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Memuat checkout">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <Content />
      </Suspense>
    </main>
  );
}
