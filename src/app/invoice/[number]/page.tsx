import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Logo } from "@/components/layout/logo";
import { PrintButton } from "@/components/shared/print-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { effectivePrice } from "@/features/payment/pricing";
import { getOrderDetail } from "@/features/payment/queries";
import { formatRupiah, formatTanggalJam } from "@/lib/format";
import { METHOD_LABELS } from "@/lib/payment";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

const statusText = {
  MENUNGGU: "Belum dibayar",
  BERHASIL: "Lunas",
  GAGAL: "Dibatalkan",
  KEDALUWARSA: "Kedaluwarsa",
  DIKEMBALIKAN: "Dikembalikan",
} as const;

async function Invoice({ params }: { params: PageProps<"/invoice/[number]">["params"] }) {
  const { number } = await params;
  const user = await requireUserPage(`/invoice/${number}`);
  const o = await getOrderDetail(decodeURIComponent(number), user);
  if (!o) notFound();
  const payment = o.payments[0];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href={`/transaksi/${o.number}`}>Kembali ke transaksi</Link>
        </Button>
        <PrintButton />
      </div>

      <article aria-label={`Invoice ${o.number}`} className="flex flex-col gap-8 rounded-xl border border-border bg-white p-6 md:p-10 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <Logo size="lg" />
          <div className="flex flex-col gap-1 text-right">
            <h1 className="text-2xl font-extrabold tracking-wide text-primary uppercase">Invoice</h1>
            <p className="font-semibold tabular-nums">{o.number}</p>
            <p className={`text-lg font-bold uppercase ${o.status === "BERHASIL" ? "text-success" : "text-foreground"}`}>{statusText[o.status]}</p>
          </div>
        </header>

        <dl className="grid gap-6 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Ditagihkan kepada</dt>
            <dd className="font-semibold">{o.user.name}</dd>
            <dd>{o.user.email}</dd>
            {o.user.profile?.phone && <dd className="tabular-nums">{o.user.profile.phone}</dd>}
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Tanggal pesan</dt>
            <dd className="font-semibold">{formatTanggalJam(o.createdAt)}</dd>
            <dt className="mt-2 text-muted-foreground">{o.paidAt ? "Tanggal bayar" : "Batas pembayaran"}</dt>
            <dd className="font-semibold">{formatTanggalJam(o.paidAt ?? o.expiresAt)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Metode pembayaran</dt>
            <dd className="font-semibold">{payment ? METHOD_LABELS[payment.method] : "–"}</dd>
            {payment?.externalId && <dd className="text-muted-foreground tabular-nums">Ref. {payment.externalId}</dd>}
          </div>
        </dl>

        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">Rincian tagihan</caption>
          <thead>
            <tr className="border-b-2 border-foreground text-sm" /* taste-skill-ignore: garis tabel invoice */>
              <th scope="col" className="py-2 font-semibold">Deskripsi</th>
              <th scope="col" className="py-2 text-right font-semibold">Harga</th>
              <th scope="col" className="py-2 text-right font-semibold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.productId} className="border-b border-border" /* taste-skill-ignore: baris tabel */>
                <th scope="row" className="py-3 font-semibold">
                  {i.nameSnapshot}
                  <span className="block text-sm font-normal text-muted-foreground">Masa aktif {i.activeDays} hari</span>
                </th>
                <td className="py-3 text-right">{formatRupiah(i.price)}</td>
                <td className="py-3 text-right">{formatRupiah(effectivePrice(i))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2} className="pt-3 text-right font-normal">Subtotal</th>
              <td className="pt-3 text-right">{formatRupiah(o.subtotal)}</td>
            </tr>
            {o.discount > 0 && (
              <tr>
                <th scope="row" colSpan={2} className="pt-1 text-right font-normal">
                  Potongan{o.voucher ? ` voucher ${o.voucher.code}` : ""}
                </th>
                <td className="pt-1 text-right">−{formatRupiah(o.discount)}</td>
              </tr>
            )}
            <tr>
              <th scope="row" colSpan={2} className="pt-2 text-right text-lg font-extrabold">Total</th>
              <td className="pt-2 text-right text-lg font-extrabold">{formatRupiah(o.total)}</td>
            </tr>
          </tfoot>
        </table>

        <footer className="text-sm text-muted-foreground">
          Taman Pelajar · Pelatihan Berkualitas · Penilaian Cermat · Sertifikat Akurat · halo@tamanpelajar.com. Invoice ini dibuat
          otomatis dan sah tanpa tanda tangan.
        </footer>
      </article>
    </>
  );
}

// Invoice yang bisa dicetak atau disimpan sebagai PDF (K.4).
export default function InvoicePage({ params }: PageProps<"/invoice/[number]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 print:max-w-none print:p-0">
      <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-xl" />}>
        <Invoice params={params} />
      </Suspense>
    </main>
  );
}
