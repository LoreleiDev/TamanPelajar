import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/features/dashboard/queries";
import { expireDueOrders } from "@/features/payment/orders";
import { formatRupiah, formatTanggalJam } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Transaksi", robots: { index: false } };

const statusLabel = {
  MENUNGGU: { text: "Menunggu pembayaran", cls: "text-warning" },
  BERHASIL: { text: "Berhasil", cls: "text-success" },
  GAGAL: { text: "Gagal", cls: "text-destructive" },
  KEDALUWARSA: { text: "Kedaluwarsa", cls: "text-muted-foreground" },
  DIKEMBALIKAN: { text: "Dikembalikan", cls: "text-muted-foreground" },
} as const;

const methodLabel = {
  VIRTUAL_ACCOUNT: "Virtual account",
  QRIS: "QRIS",
  E_WALLET: "E-wallet",
  TRANSFER_BANK: "Transfer bank",
  SIMULASI: "Simulasi",
} as const;

async function Content() {
  const user = await requireUserPage("/dashboard/transaksi");
  await expireDueOrders(user.id);
  const orders = await getOrders(user.id);
  return (
    <>
      <DashboardHeading title="Transaksi">Riwayat pesanan paket. Buka nomor pesanan untuk membayar atau melihat invoice.</DashboardHeading>
      {orders.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Pesanan muncul di sini setelah kamu membeli paket."
          action={
            <Button asChild>
              <Link href="/program">Lihat katalog</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-176 text-left">
            <caption className="sr-only">Riwayat transaksi</caption>
            <thead className="bg-secondary text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Nomor pesanan</th>
                <th scope="col" className="px-4 py-3 font-semibold">Produk</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-4 py-3 font-semibold">Metode</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tanggal</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {orders.map((o) => (
                <tr key={o.number} className="border-t border-border align-top" /* taste-skill-ignore: baris tabel */>
                  <th scope="row" className="px-4 py-3 font-semibold">
                    <Link href={`/transaksi/${o.number}`} className="text-primary hover:underline">
                      {o.number}
                    </Link>
                  </th>
                  <td className="px-4 py-3">{o.items.map((i) => i.nameSnapshot).join(", ")}</td>
                  <td className="px-4 py-3 text-right">
                    {formatRupiah(o.total)}
                    {o.discount > 0 && <span className="block text-sm text-muted-foreground">hemat {formatRupiah(o.discount)}</span>}
                  </td>
                  <td className="px-4 py-3">{o.payments[0] ? methodLabel[o.payments[0].method] : "–"}</td>
                  <td className={`px-4 py-3 font-semibold ${statusLabel[o.status].cls}`}>
                    {statusLabel[o.status].text}
                    {o.status === "MENUNGGU" && (
                      <span className="block text-sm font-normal text-muted-foreground">Batas {formatTanggalJam(o.expiresAt)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatTanggalJam(o.paidAt ?? o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Transaksi (F.1, K.3 ringkas). Pembayaran, detail, dan invoice dibangun di Tahap 4.
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
