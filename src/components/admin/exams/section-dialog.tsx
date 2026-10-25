"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { simpanSubtes } from "@/features/admin/exams/actions";
import { sectionSchema, type SectionInput } from "@/features/admin/exams/schemas";

/** Tambah/ubah subtes (M.6.7): nama, durasi sendiri (I.4.15), bobot (J.1.5), passing grade. */
export function SectionDialog({ trigger, defaults, title }: { trigger: ReactNode; defaults: SectionInput; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm({ resolver: zodResolver(sectionSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const f = (name: keyof SectionInput) => ({ id: `s-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`s-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: SectionInput) => simpanSubtes(v), () => {
    toast.success(defaults.id ? "Subtes disimpan." : "Subtes ditambahkan.");
    setOpen(false);
    if (!defaults.id) form.reset(defaults);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <DialogDescription>Bila semua subtes punya durasi, subtes dikerjakan berurutan dengan waktu masing-masing.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />
          <Field label="Nama subtes" htmlFor="s-title" error={errors.title?.message}>
            <Input autoComplete="off" {...f("title")} {...form.register("title")} />
          </Field>
          <Field label="Durasi (menit, opsional)" htmlFor="s-durationMin" error={errors.durationMin?.message} hint="Kosongkan agar subtes memakai durasi total tryout.">
            <Input inputMode="numeric" {...f("durationMin")} {...form.register("durationMin")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bobot" htmlFor="s-weight" error={errors.weight?.message}>
              <Input inputMode="decimal" {...f("weight")} {...form.register("weight")} />
            </Field>
            <Field label="Passing grade" htmlFor="s-passingGrade" error={errors.passingGrade?.message} hint="Opsional">
              <Input inputMode="decimal" {...f("passingGrade")} {...form.register("passingGrade")} />
            </Field>
          </div>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Menyimpan…" : "Simpan subtes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
