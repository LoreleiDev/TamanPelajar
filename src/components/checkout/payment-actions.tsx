"use client";

import { CircleCheck, CircleX, ExternalLink, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { batalkanPesanan, simulasiBayar } from "@/features/payment/actions";

/** Tombol bayar untuk pesanan MENUNGGU (K.2, K.3). */
export function PaymentActions({ number, provider, redirectUrl }: { number: string; provider: string; redirectUrl: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const simulate = (outcome: "BERHASIL" | "GAGAL") =>
    startTransition(async () => {
      const r = await simulasiBayar({ number, outcome });
      if (!r.ok) {
        toast.error(r.error);
        router.refresh();
        return;
      }
      if (outcome === "BERHASIL") toast.success("Pembayaran berhasil. Paket sudah aktif.");
      else toast.info("Pembayaran ditandai gagal.");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {provider === "simulasi" ? (
          <>
            <Button size="lg" disabled={pending} onClick={() => simulate("BERHASIL")}>
              <CircleCheck aria-hidden="true" data-icon="inline-start" />
              Bayar sekarang (simulasi)
            </Button>
            <Button size="lg" variant="outline" disabled={pending} onClick={() => simulate("GAGAL")}>
              <CircleX aria-hidden="true" data-icon="inline-start" />
              Gagalkan pembayaran
            </Button>
          </>
        ) : redirectUrl ? (
          <Button asChild size="lg">
            <a href={redirectUrl}>
              <ExternalLink aria-hidden="true" data-icon="inline-start" />
              Bayar lewat Midtrans
            </a>
          </Button>
        ) : null}
        <Button size="lg" variant="ghost" disabled={pending} onClick={() => router.refresh()}>
          <RefreshCw aria-hidden="true" data-icon="inline-start" />
          Perbarui status
        </Button>
      </div>
      <ConfirmDialog
        trigger={
          <Button variant="link" className="self-start px-0 text-destructive">
            Batalkan pesanan
          </Button>
        }
        title="Batalkan pesanan ini?"
        description="Pesanan yang dibatalkan tidak bisa dibayar lagi. Voucher yang dipakai kembali bisa digunakan."
        confirmLabel="Ya, batalkan"
        destructive
        onConfirm={async () => {
          const r = await batalkanPesanan({ number });
          if (!r.ok) return void toast.error(r.error);
          toast.info("Pesanan dibatalkan.");
          router.refresh();
        }}
      />
    </div>
  );
}
