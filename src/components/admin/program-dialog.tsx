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
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { shouldAutoSlug, slugify } from "@/features/admin/form-rules";
import { hapusProgram, simpanProgram } from "@/features/admin/program-actions";
import { programSchema, type ProgramInput } from "@/features/admin/program-schema";

/** Tambah/ubah program (kategori ujian). */
export function ProgramDialog({ trigger, defaults }: { trigger: ReactNode; defaults: ProgramInput }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm({ resolver: zodResolver(programSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const f = (name: keyof ProgramInput) => ({ id: `p-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`p-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: ProgramInput) => simpanProgram(v), () => {
    toast.success(defaults.id ? "Program disimpan." : "Program ditambahkan.");
    setOpen(false);
    if (!defaults.id) form.reset(defaults);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">{defaults.id ? "Ubah program" : "Tambah program"}</DialogTitle>
          <DialogDescription>Program tampil di beranda dan katalog sebagai pengelompokan paket.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />
          <Field label="Nama program" htmlFor="p-name" error={errors.name?.message}>
            <Input
              autoComplete="off"
              {...f("name")}
              {...form.register("name", { onBlur: (e) => shouldAutoSlug(form.getValues("slug"), e) && form.setValue("slug", slugify(e.target.value)) })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nama singkat" htmlFor="p-shortName" error={errors.shortName?.message} hint="Mis. UTBK, SKD">
              <Input autoComplete="off" {...f("shortName")} {...form.register("shortName")} />
            </Field>
            <Field label="Urutan" htmlFor="p-order" error={errors.order?.message}>
              <Input inputMode="numeric" {...f("order")} {...form.register("order")} />
            </Field>
          </div>
          <Field label="Slug URL" htmlFor="p-slug" error={errors.slug?.message} hint="Dipakai di filter katalog dan impor soal.">
            <Input autoComplete="off" {...f("slug")} {...form.register("slug")} />
          </Field>
          <Field label="Sasaran peserta" htmlFor="p-audience" error={errors.audience?.message} hint="Mis. Siswa kelas 12 dan alumni">
            <Input autoComplete="off" {...f("audience")} {...form.register("audience")} />
          </Field>
          <Field label="Deskripsi" htmlFor="p-description" error={errors.description?.message}>
            <Textarea rows={3} {...f("description")} {...form.register("description")} />
          </Field>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Menyimpan…" : "Simpan program"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteProgramButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          Hapus
        </Button>
      }
      title={`Hapus program ${name}?`}
      description="Program yang tidak dipakai apa pun dihapus permanen."
      confirmLabel="Hapus program"
      destructive
      onConfirm={async () => {
        const r = await hapusProgram({ id });
        if (!r.ok) return void toast.error(r.error);
        toast.success("Program dihapus.");
        router.refresh();
      }}
    />
  );
}
