import { CircleAlert, CircleCheck, CircleX, Clock, FileText, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { PaymentActions } from "@/components/checkout/payment-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { statusTone } from "@/features/payment/labels";
import { PageHeader, SummaryPanel } from "@/components/shared/page-header";
import { effectivePrice } from "@/features/payment/pricing";
import { getOrderDetail, type OrderDetail } from "@/features/payment/queries";
import { formatRupiah, formatTanggal, formatTanggalJam } from "@/lib/format";
import type { VaBank } from "@/lib/midtrans";
import { BANK_LABELS, METHOD_LABELS } from "@/lib/payment";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Detail transaksi", robots: { index: false } };

const statusView = {
  MENUNGGU: { icon: Clock, text: "Menunggu pembayaran" },
  BERHASIL: { icon: CircleCheck, text: "Pembayaran berhasil" },
  GAGAL: { icon: CircleX, text: "Pembayaran gagal atau dibatalkan" },
  KEDALUWARSA: { icon: CircleAlert, text: "Batas pembayaran lewat" },
  DIKEMBALIKAN: { icon: CircleAlert, text: "Dana dikembalikan" },
} as const;

function Instructions({ o }: { o: OrderDetail }) {
  const p = o.payments[0];
  if (!p) return null;
  const raw = (p.rawResponse ?? {}) as { bank?: VaBank | null; redirectUrl?: string | null };
  const demo = p.provider === "simulasi";
  let how: ReactNode;
  if (p.method === "VIRTUAL_ACCOUNT" || p.method === "TRANSFER_BANK") {
    how = p.vaNumber ? (
      <dl className="flex flex-col gap-1">
        <dt className="text-sm text-muted-foreground">
          {p.method === "VIRTUAL_ACCOUNT" ? `Nomor virtual account ${raw.bank ? BANK_LABELS[raw.bank] : ""}` : "Nomor rekening tujuan"}
        </dt>
        <dd className="text-2xl font-extrabold tracking-wider tabular-nums">{p.vaNumber}</dd>
      </dl>
    ) : (
      <p>Nomor tujuan transfer tampil di halaman Midtrans.</p>
    );
  } else if (p.method === "SIMULASI") {
    how = <p>Pesanan ini memakai pembayaran simulasi. Gunakan tombol di bawah untuk menandai hasil pembayaran.</p>;
  } else if (p.method === "QRIS") {
    how = (
      <p>
        {demo
          ? "Di mode simulasi kode QR tidak ditampilkan. Gunakan tombol di bawah untuk menandai hasil pembayaran."
          : "Kode QRIS tampil di halaman Midtrans; pindai dengan aplikasi bank atau e-wallet."}
      </p>
    );
  } else {
    how = <p>{demo ? "Di mode simulasi tidak ada aplikasi e-wallet yang dibuka." : "Kamu diarahkan ke GoPay atau ShopeePay dari halaman Midtrans."}</p>;
  }
  return (
    <section aria-labelledby="bayar-judul" className="flex flex-col gap-4 rounded-xl border-2 border-primary/40 p-5">
      <h2 id="bayar-judul" className="text-heading">
        Cara membayar
      </h2>
      {how}
      <p className="text-sm tabular-nums">
        Bayar tepat <strong>{formatRupiah(o.total)}</strong> sebelum <strong>{formatTanggalJam(o.expiresAt)}</strong>. Status diperbarui
        otomatis setelah pembayaran terverifikasi.
      </p>
      {demo && p.vaNumber && <p className="rounded-lg bg-secondary px-4 py-3 text-sm">Mode demo: nomor di atas hanya contoh dan tidak bisa dipakai membayar.</p>}
      <PaymentActions number={o.number} provider={p.provider} redirectUrl={raw.redirectUrl ?? null} />
    </section>
  );
}

async function Content({ params }: { params: PageProps<"/transaksi/[number]">["params"] }) {
  const { number } = await params;
  const user = await requireUserPage(`/transaksi/${number}`);
  const o = await getOrderDetail(decodeURIComponent(number), user);
  if (!o) notFound();
  const view = statusView[o.status];
  const payment = o.payments[0];
  const rows: [string, string][] = [
    ["Nomor pesanan", o.number],
    ["Tanggal pesan", formatTanggalJam(o.createdAt)],
    ["Harga", formatRupiah(o.subtotal)],
    ["Diskon", o.discount ? `−${formatRupiah(o.discount)}${o.voucher ? ` (${o.voucher.code})` : ""}` : "–"],
    ["Metode", payment ? METHOD_LABELS[payment.method] : "–"],
    [o.status === "BERHASIL" ? "Dibayar" : "Batas pembayaran", formatTanggalJam(o.paidAt ?? o.expiresAt)],
  ];

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Transaksi", href: "/dashboard/transaksi" }, { label: o.number }]}
        eyebrow={o.status === "MENUNGGU" ? "Langkah 3 dari 3: bayar" : "Detail transaksi"}
        title={
          <>
            Pesanan <span className="text-[clamp(1.75rem,7vw,3rem)] whitespace-nowrap tabular-nums">{o.number}</span>
          </>
        }
      >
        <StatusBadge tone={statusTone[o.status]} variant="box" icon={view.icon} role="status">
          {view.text}
        </StatusBadge>
      </PageHeader>
      <div className="page-container py-10 md:py-12">

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          {o.status === "MENUNGGU" && <Instructions o={o} />}

          {o.status === "BERHASIL" && (
            <section aria-labelledby="aktif-judul" className="flex flex-col gap-3 rounded-xl bg-accent p-5">
              <h2 id="aktif-judul" className="text-heading">
                Paket sudah aktif
              </h2>
              <ul className="flex flex-col gap-1">
                {o.enrollments.map((e) => (
                  <li key={e.product.name} className="flex items-start gap-2">
                    <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span>
                      {e.product.name}, aktif sampai <strong>{formatTanggal(e.expiresAt)}</strong>
                    </span>
                  </li>
                ))}
              </ul>
              <Button asChild className="self-start">
                <Link href="/dashboard/kelas">
                  <LayoutDashboard aria-hidden="true" data-icon="inline-start" />
                  Mulai belajar
                </Link>
              </Button>
            </section>
          )}

          {(o.status === "GAGAL" || o.status === "KEDALUWARSA") && (
            <section className="flex flex-col gap-3 rounded-xl bg-secondary p-5">
              <p>Pesanan ini tidak bisa dibayar lagi. Buat pesanan baru dari halaman paket bila masih ingin membeli.</p>
              <div className="flex flex-wrap gap-3">
                {o.items.map((i) => (
                  <Button key={i.productId} asChild variant="outline">
                    <Link href={`/paket/${i.product.slug}`}>Lihat {i.nameSnapshot}</Link>
                  </Button>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="produk-judul" className="flex flex-col gap-3">
            <h2 id="produk-judul" className="text-heading">
              Produk
            </h2>
            <div className="relative overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
              <table className="w-full text-left">
                <caption className="sr-only">Produk dalam pesanan</caption>
                <thead className="bg-secondary text-sm">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Paket</th>
                    <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Harga</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Dibayar</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {o.items.map((i) => (
                    <tr key={i.productId} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                      <th scope="row" className="px-4 py-3 font-semibold">
                        {i.nameSnapshot}
                        <span className="block text-sm font-normal text-muted-foreground">Masa aktif {i.activeDays} hari</span>
                      </th>
                      <td className="hidden px-4 py-3 text-right sm:table-cell">{formatRupiah(i.price)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {effectivePrice(i) < i.price && <s className="block text-sm text-muted-foreground sm:hidden">{formatRupiah(i.price)}</s>}
                        {formatRupiah(effectivePrice(i))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <SummaryPanel title="Rincian pembayaran" titleId="rincian-judul">
          <dl className="flex flex-col gap-2 text-sm tabular-nums">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 pt-3 text-lg font-extrabold">
              <dt>Total</dt>
              <dd>{formatRupiah(o.total)}</dd>
            </div>
          </dl>
          <Button asChild variant="outline">
            <Link href={`/invoice/${o.number}`}>
              <FileText aria-hidden="true" data-icon="inline-start" />
              Lihat invoice
            </Link>
          </Button>
        </SummaryPanel>
      </div>
      </div>
    </>
  );
}

// Detail transaksi (K.3): nomor, produk, harga, diskon, total, metode, batas bayar, status,
// tombol bayar, dan invoice.
export default function TransaksiDetailPage({ params }: PageProps<"/transaksi/[number]">) {
  return (
    <main className="flex flex-col">
      <Suspense
        fallback={
          <div className="page-container flex flex-col gap-4 py-10" aria-busy="true" aria-label="Memuat transaksi">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <Content params={params} />
      </Suspense>
    </main>
  );
}
