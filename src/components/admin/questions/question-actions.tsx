"use client";

import { Copy, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { duplikasiSoal, hapusSoal } from "@/features/admin/questions/actions";

/** Duplikasi (M.5.5) dan hapus satu soal. */
export function QuestionActions({ id, usedIn }: { id: string; usedIn: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await duplikasiSoal({ ids: [id] });
            if (!r.ok) return void toast.error(r.error);
            toast.success("Salinan soal dibuat sebagai draf.");
            router.push(`/admin/bank-soal/${r.data.id}`);
          })
        }
      >
        <Copy data-icon="inline-start" />
        Duplikasi
      </Button>
      {usedIn === 0 && (
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <Trash2 data-icon="inline-start" />
              Hapus soal
            </Button>
          }
          title="Hapus soal ini?"
          description="Soal disembunyikan dari bank soal. Soal yang belum dipakai tryout tidak memengaruhi nilai siapa pun."
          confirmLabel="Hapus soal"
          destructive
          onConfirm={async () => {
            const r = await hapusSoal({ ids: [id] });
            if (!r.ok) return void toast.error(r.error);
            toast.success("Soal dihapus.");
            router.push("/admin/bank-soal");
          }}
        />
      )}
    </div>
  );
}
