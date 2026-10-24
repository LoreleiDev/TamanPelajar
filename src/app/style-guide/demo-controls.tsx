"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useRequireLogin } from "@/components/shared/require-login";
import { Button } from "@/components/ui/button";

export function DemoControls() {
  const { requireLogin } = useRequireLogin();
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => toast.success("Perubahan profil disimpan.")}>
        Tampilkan toast berhasil
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error("Voucher HEMAT10 sudah kedaluwarsa. Coba kode lain.")}
      >
        Tampilkan toast gagal
      </Button>
      <Button
        variant="outline"
        onClick={() => requireLogin("Untuk membuka bab 1 Penalaran Umum, masuk ke akun Anda.")}
      >
        Buka dialog masuk dulu
      </Button>
      <ConfirmDialog
        trigger={<Button variant="destructive">Hapus soal</Button>}
        title="Hapus soal ini?"
        description="Soal dipindahkan ke arsip dan tidak muncul di tryout baru. Tryout yang sudah dikerjakan tidak berubah."
        confirmLabel="Hapus soal"
        destructive
        onConfirm={() => {
          toast.success("Soal dihapus.");
        }}
      />
    </div>
  );
}
