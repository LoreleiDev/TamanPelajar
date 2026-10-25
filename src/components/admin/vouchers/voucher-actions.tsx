"use client";

import { Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { aturStatusVoucher, hapusVoucher } from "@/features/admin/vouchers/actions";

/** Aktif/nonaktifkan dan hapus voucher (hapus hanya bila belum dipakai). */
export function VoucherActions({ id, code, active, used }: { id: string; code: string; active: boolean; used: number }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmDialog
        trigger={
          <Button variant="outline">
            <Power data-icon="inline-start" />
            {active ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        }
        title={active ? `Nonaktifkan ${code}?` : `Aktifkan ${code}?`}
        description={active ? "Kode langsung ditolak di checkout. Pesanan yang sudah memakainya tidak berubah." : "Kode bisa dipakai lagi selama masa berlaku dan kuota masih ada."}
        confirmLabel={active ? "Nonaktifkan" : "Aktifkan"}
        onConfirm={async () => {
          const r = await aturStatusVoucher({ id, active: !active });
          if (!r.ok) return void toast.error(r.error);
          toast.success(active ? "Voucher dinonaktifkan." : "Voucher diaktifkan.");
          router.refresh();
        }}
      />
      {used === 0 && (
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <Trash2 data-icon="inline-start" />
              Hapus voucher
            </Button>
          }
          title={`Hapus ${code}?`}
          description="Voucher yang belum pernah dipakai dihapus permanen."
          confirmLabel="Hapus"
          destructive
          onConfirm={async () => {
            const r = await hapusVoucher({ id });
            if (!r.ok) return void toast.error(r.error);
            toast.success("Voucher dihapus.");
            router.push("/admin/voucher");
          }}
        />
      )}
    </div>
  );
}
