"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { hapusMataPelajaran, simpanMataPelajaran } from "@/features/admin/subject-actions";
import { subjectSchema, type SubjectInput } from "@/features/admin/subject-schema";

/** Tambah/ubah mata pelajaran. */
export function SubjectDialog({ trigger, defaults }: { trigger: ReactNode; defaults: SubjectInput }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm({ resolver: zodResolver(subjectSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const f = (name: keyof SubjectInput) => ({ id: `s-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`s-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: SubjectInput) => simpanMataPelajaran(v), () => {
    toast.success(defaults.id ? "Mata pelajaran disimpan." : "Mata pelajaran ditambahkan.");
    setOpen(false);
    if (!defaults.id) form.reset(defaults);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">{defaults.id ? "Ubah mata pelajaran" : "Tambah mata pelajaran"}</DialogTitle>
          <DialogDescription>
            {defaults.id
              ? "Nama baru langsung dipakai di semua kelas, video, dan soal dengan mata pelajaran ini."
              : "Mata pelajaran bisa dipilih di form kelas, video, dan bank soal."}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />
          <Field label="Nama mata pelajaran" htmlFor="s-name" error={errors.name?.message} hint="Mis. Penalaran Umum">
            <Input autoComplete="off" {...f("name")} {...form.register("name")} />
          </Field>
          <Field label="Urutan" htmlFor="s-order" error={errors.order?.message} hint="Angka kecil tampil lebih dulu di pilihan.">
            <Input inputMode="numeric" className="max-w-32" {...f("order")} {...form.register("order")} />
          </Field>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Menyimpan…" : "Simpan mata pelajaran"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteSubjectButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          Hapus<span className="sr-only"> {name}</span>
        </Button>
      }
      title={`Hapus mata pelajaran ${name}?`}
      description="Mata pelajaran yang tidak dipakai kelas, video, atau soal dihapus permanen."
      confirmLabel="Hapus mata pelajaran"
      destructive
      onConfirm={async () => {
        const r = await hapusMataPelajaran({ id });
        if (!r.ok) return void toast.error(r.error);
        toast.success("Mata pelajaran dihapus.");
        router.refresh();
      }}
    />
  );
}
