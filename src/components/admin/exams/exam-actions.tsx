"use client";

import { Copy, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { duplikasiTryout, hapusTryout } from "@/features/admin/exams/actions";

/** Duplikat dan hapus tryout. */
export function ExamActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await duplikasiTryout({ id });
            if (!r.ok) return void toast.error(r.error);
            toast.success("Salinan tryout dibuat sebagai draf.");
            router.push(`/admin/tryout/${r.data.id}`);
          })
        }
      >
        <Copy data-icon="inline-start" />
        Duplikat
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 data-icon="inline-start" />
            Hapus
          </Button>
        }
        title={`Hapus ${title}?`}
        description="Tryout disembunyikan dari halaman publik dan paket. Hasil siswa yang sudah ada tetap tersimpan."
        confirmLabel="Hapus tryout"
        destructive
        onConfirm={async () => {
          const r = await hapusTryout({ id });
          if (!r.ok) return void toast.error(r.error);
          toast.success("Tryout dihapus.");
          router.push("/admin/tryout");
        }}
      />
    </>
  );
}
