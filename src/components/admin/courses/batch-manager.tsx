"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { hapusBatch, simpanBatch } from "@/features/admin/practical-actions";
import { batchSchema, type BatchInput } from "@/features/certificate/schemas";

export interface BatchRow {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  period: string;
  phase: "berjalan" | "akan-datang" | "selesai";
  participants: number;
  passed: number;
  waiting: number;
}

const phase: Record<BatchRow["phase"], { label: string; tone: StatusTone }> = {
  berjalan: { label: "Berjalan", tone: "berhasil" },
  "akan-datang": { label: "Akan datang", tone: "menunggu" },
  selesai: { label: "Selesai", tone: "netral" },
};

function BatchDialog({ trigger, defaults }: { trigger: ReactNode; defaults: BatchInput }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm({ resolver: zodResolver(batchSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const f = (name: keyof BatchInput) => ({ id: `b-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`b-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: BatchInput) => simpanBatch(v), () => {
    toast.success(defaults.id ? "Batch disimpan." : "Batch ditambahkan.");
    setOpen(false);
    if (!defaults.id) form.reset(defaults);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">{defaults.id ? "Ubah batch" : "Tambah batch"}</DialogTitle>
          <DialogDescription>
            Siswa berlangganan masuk batch yang sedang berjalan. Tugas praktik dikirim paling lambat tanggal selesai (23.59 WIB).
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />
          <Field label="Nama batch" htmlFor="b-name" error={errors.name?.message} hint="Mis. Batch Januari 2027">
            <Input autoComplete="off" {...f("name")} {...form.register("name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal mulai" htmlFor="b-startsOn" error={errors.startsOn?.message}>
              <Input type="date" {...f("startsOn")} {...form.register("startsOn")} />
            </Field>
            <Field label="Tanggal selesai" htmlFor="b-endsOn" error={errors.endsOn?.message}>
              <Input type="date" {...f("endsOn")} {...form.register("endsOn")} />
            </Field>
          </div>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Menyimpan…" : "Simpan batch"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Tab Batch di detail kelas: angkatan belajar untuk sertifikat dan ulang gratis. */
export function BatchManager({ courseId, batches, hasCertificate }: { courseId: string; batches: BatchRow[]; hasCertificate: boolean }) {
  const router = useRouter();
  const empty: BatchInput = { courseId, name: "", startsOn: "", endsOn: "" };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[70ch] text-sm text-muted-foreground">
          {hasCertificate
            ? "Siswa yang gagal syarat nilai atau tugas praktik bisa mengulang gratis di batch berikutnya. Tanpa batch, bagian sertifikat tidak tampil untuk siswa."
            : "Sertifikat kelas ini nonaktif. Aktifkan di tab Pengaturan agar batch dipakai untuk sertifikat."}
        </p>
        <BatchDialog
          defaults={empty}
          trigger={
            <Button>
              <CalendarPlus data-icon="inline-start" aria-hidden="true" />
              Tambah batch
            </Button>
          }
        />
      </div>
      {batches.length === 0 ? (
        <EmptyState title="Belum ada batch" description="Buat batch pertama, mis. tiga bulan ke depan, agar siswa bisa mengejar sertifikat." />
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-160 text-left">
            <caption className="sr-only">Batch kelas</caption>
            <thead className="bg-secondary text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Batch</th>
                <th scope="col" className="px-4 py-3 font-semibold">Periode</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Peserta</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {batches.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <th scope="row" className="px-4 py-3 font-semibold">{b.name}</th>
                  <td className="px-4 py-3 text-sm">{b.period}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge tone={phase[b.phase].tone}>{phase[b.phase].label}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {b.participants} siswa
                    <span className="block text-muted-foreground">
                      {b.passed} lulus, {b.waiting} menunggu penilaian
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <BatchDialog
                        defaults={{ id: b.id, courseId, name: b.name, startsOn: b.startsOn, endsOn: b.endsOn }}
                        trigger={
                          <Button size="sm" variant="ghost">
                            <Pencil data-icon="inline-start" aria-hidden="true" />
                            Ubah<span className="sr-only"> {b.name}</span>
                          </Button>
                        }
                      />
                      {b.participants === 0 && (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                              Hapus<span className="sr-only"> {b.name}</span>
                            </Button>
                          }
                          title={`Hapus ${b.name}?`}
                          description="Batch tanpa peserta dihapus permanen."
                          confirmLabel="Hapus batch"
                          destructive
                          onConfirm={async () => {
                            const r = await hapusBatch({ id: b.id });
                            if (!r.ok) return void toast.error(r.error);
                            toast.success("Batch dihapus.");
                            router.refresh();
                          }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
