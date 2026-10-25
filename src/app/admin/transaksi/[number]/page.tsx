import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { OrderActions } from "@/components/admin/orders/order-actions";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { enrollmentLabel, enrollmentTone } from "@/features/admin/labels";
import { getAdminOrder } from "@/features/admin/orders/queries";
import { statusLabel, statusTone } from "@/features/payment/labels";
import { effectivePrice } from "@/features/payment/pricing";
import { formatRupiah, formatTanggal, formatTanggalJam } from "@/lib/format";
import { METHOD_LABELS } from "@/lib/payment";

export const metadata: Metadata = { title: "Detail transaksi", robots: { index: false } };

const actionLabel: Record<string, string> = {
  "transaksi.verifikasi-manual": "Verifikasi pembayaran manual",
  "transaksi.batalkan": "Pesanan dibatalkan",
  "transaksi.kembalikan-dana": "Dana ditandai dikembalikan",
};

async function Content({ params }: { params: PageProps<"/admin/transaksi/[number]">["params"] }) {
  const { number } = await params;
  await adminPage(`/admin/transaksi/${number}`);
  const o = await getAdminOrder(number);
  if (!o) notFound();

  const summary: [string, ReactNode][] = [
    [
      "Pembeli",
      <Link key="u" href={`/admin/pengguna/${o.user.id}`} className="text-primary hover:underline">
        {o.user.name} ({o.user.email})
      </Link>,
    ],
    ["Dibuat", formatTanggalJam(o.createdAt)],
    ["Batas bayar", formatTanggalJam(o.expiresAt)],
    ["Dibayar", o.paidAt ? formatTanggalJam(o.paidAt) : "–"],
    ["Voucher", o.voucher?.code ?? "–"],
  ];

  return (
    <>
      <Breadcrumb items={[{ label: "Transaksi", href: "/admin/transaksi" }, { label: o.number }]} />
      <DashboardHeading
        title={`Pesanan ${o.number}`}
        action={
          <Button asChild variant="outline">
            <Link href={`/invoice/${o.number}`}>Lihat invoice</Link>
          </Button>
        }
      />
      <StatusBadge tone={statusTone[o.status]} variant="box" role="status">
        {statusLabel[o.status]}
      </StatusBadge>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <DashboardSection title="Ringkasan">
            <dl className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-[0.9375rem]">
              {summary.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </DashboardSection>

          <DashboardSection title="Produk">
            <div className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
              <table className="w-full min-w-120 text-left">
                <caption className="sr-only">Produk dalam pesanan</caption>
                <thead className="bg-secondary text-sm">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      Produk
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      Masa aktif
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                      Harga
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {o.items.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <th scope="row" className="px-4 py-2.5 font-semibold">
                        {i.nameSnapshot}
                      </th>
                      <td className="px-4 py-2.5">{i.activeDays} hari</td>
                      <td className="px-4 py-2.5 text-right">{formatRupiah(effectivePrice(i))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border text-[0.9375rem] tabular-nums">
                  <tr>
                    <th scope="row" colSpan={2} className="px-4 pt-2.5 text-right font-normal text-muted-foreground">
                      Subtotal
                    </th>
                    <td className="px-4 pt-2.5 text-right">{formatRupiah(o.subtotal)}</td>
                  </tr>
                  <tr>
                    <th scope="row" colSpan={2} className="px-4 text-right font-normal text-muted-foreground">
                      Diskon
                    </th>
                    <td className="px-4 text-right">{o.discount ? `−${formatRupiah(o.discount)}` : formatRupiah(0)}</td>
                  </tr>
                  <tr>
                    <th scope="row" colSpan={2} className="px-4 pb-2.5 text-right font-bold">
                      Total
                    </th>
                    <td className="px-4 pb-2.5 text-right font-bold">{formatRupiah(o.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </DashboardSection>

          <DashboardSection title="Pembayaran">
            {o.payments.length === 0 ? (
              <p className="text-muted-foreground">Belum ada percobaan pembayaran.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {o.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
                    <span className="font-semibold">{METHOD_LABELS[p.method]}</span>
                    <span className="text-sm text-muted-foreground">
                      {p.provider === "midtrans" ? "Midtrans" : "Simulasi"}
                      {p.vaNumber && `, VA ${p.vaNumber}`}
                    </span>
                    <StatusBadge tone={statusTone[p.status]} className="ml-auto">
                      {statusLabel[p.status]}
                    </StatusBadge>
                    <span className="w-full text-sm text-muted-foreground">
                      Dibuat {formatTanggalJam(p.createdAt)}
                      {p.paidAt && `, dibayar ${formatTanggalJam(p.paidAt)}`}
                      {p.externalId && `, ID ${p.externalId}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          {o.enrollments.length > 0 && (
            <DashboardSection title="Akses dari pesanan ini">
              <ul className="flex flex-col gap-2">
                {o.enrollments.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-semibold">{e.product.name}</span>
                    <StatusBadge tone={enrollmentTone[e.status]}>{enrollmentLabel[e.status]}</StatusBadge>
                    <span className="text-sm text-muted-foreground">sampai {formatTanggal(e.expiresAt)}</span>
                  </li>
                ))}
              </ul>
            </DashboardSection>
          )}
        </div>

        <aside className="flex flex-col gap-8 self-start xl:sticky xl:top-24">
          <DashboardSection title="Tindakan">
            <OrderActions number={o.number} status={o.status} buyer={o.user.name} />
          </DashboardSection>
          <DashboardSection title="Riwayat tindakan admin">
            {o.logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada tindakan admin.</p>
            ) : (
              <ol className="flex flex-col gap-2 text-sm">
                {o.logs.map((l) => (
                  <li key={l.id}>
                    <span className="font-semibold">{actionLabel[l.action] ?? l.action}</span>
                    <span className="block text-muted-foreground">
                      {l.actor.name}, {formatTanggalJam(l.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </DashboardSection>
        </aside>
      </div>
    </>
  );
}

// Detail transaksi admin (C.2.6).
export default function AdminOrderDetailPage({ params }: PageProps<"/admin/transaksi/[number]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
