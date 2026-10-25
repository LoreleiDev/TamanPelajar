"use client";

import { BadgeCheck, CircleX, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { kelolaTransaksi } from "@/features/admin/orders/actions";

/** Tombol kelola pembayaran sesuai status pesanan; semuanya lewat konfirmasi (P.2.6). */
export function OrderActions({ number, status, buyer }: { number: string; status: string; buyer: string }) {
  const router = useRouter();
  const run = (action: "verifikasi" | "batalkan" | "kembalikan", message: string) => async () => {
    const r = await kelolaTransaksi({ number, action });
    if (!r.ok) return void toast.error(r.error);
    toast.success(message);
    router.refresh();
  };

  if (status === "MENUNGGU") {
    return (
      <div className="flex flex-wrap gap-2">
        <ConfirmDialog
          trigger={
            <Button>
              <BadgeCheck data-icon="inline-start" />
              Verifikasi pembayaran
            </Button>
          }
          title="Tandai pesanan ini sudah dibayar?"
          description={`Pakai ini bila dana sudah dipastikan masuk (mis. transfer bank). Paket langsung aktif untuk ${buyer}.`}
          confirmLabel="Ya, sudah dibayar"
          onConfirm={run("verifikasi", "Pembayaran diverifikasi dan paket diaktifkan.")}
        />
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <CircleX data-icon="inline-start" />
              Batalkan pesanan
            </Button>
          }
          title="Batalkan pesanan ini?"
          description="Status menjadi gagal dan kuota voucher yang dipakai dikembalikan. Pembeli bisa membuat pesanan baru."
          confirmLabel="Batalkan pesanan"
          destructive
          onConfirm={run("batalkan", "Pesanan dibatalkan.")}
        />
      </div>
    );
  }
  if (status === "BERHASIL") {
    return (
      <ConfirmDialog
        trigger={
          <Button variant="outline" className="self-start text-destructive hover:text-destructive">
            <Undo2 data-icon="inline-start" />
            Tandai dana dikembalikan
          </Button>
        }
        title="Tandai dana dikembalikan?"
        description={`Pakai ini setelah dana benar-benar dikembalikan ke ${buyer}. Akses paket dari pesanan ini langsung dibatalkan.`}
        confirmLabel="Tandai dikembalikan"
        destructive
        onConfirm={run("kembalikan", "Pesanan ditandai dikembalikan dan akses dibatalkan.")}
      />
    );
  }
  return <p className="text-sm text-muted-foreground">Tidak ada tindakan untuk status ini.</p>;
}
