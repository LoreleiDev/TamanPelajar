"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckField } from "@/components/admin/form-fields";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { simpanTestimoni, terbitkanTestimoni } from "@/features/admin/site-actions";
import { testimonialSchema, type TestimonialInput } from "@/features/admin/testimonial-schema";

/** Tambah/ubah testimoni (M.1 Testimoni). */
export function TestimonialDialog({ trigger, defaults }: { trigger: ReactNode; defaults: TestimonialInput }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm({ resolver: zodResolver(testimonialSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const f = (name: keyof TestimonialInput) => ({ id: `t-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`t-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: TestimonialInput) => simpanTestimoni(v), () => {
    toast.success(defaults.id ? "Testimoni disimpan." : "Testimoni ditambahkan.");
    setOpen(false);
    if (!defaults.id) form.reset(defaults);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">{defaults.id ? "Ubah testimoni" : "Tambah testimoni"}</DialogTitle>
          <DialogDescription>Tulis apa adanya dari siswa. Avatar di beranda berupa inisial nama.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama" htmlFor="t-name" error={errors.name?.message} hint="Mis. Rani, Bandung">
              <Input autoComplete="off" {...f("name")} {...form.register("name")} />
            </Field>
            <Field label="Program" htmlFor="t-program" error={errors.program?.message}>
              <Input autoComplete="off" {...f("program")} {...form.register("program")} />
            </Field>
          </div>
          <Field label="Kalimat pembuka" htmlFor="t-opening" error={errors.opening?.message}>
            <Input autoComplete="off" {...f("opening")} {...form.register("opening")} />
          </Field>
          <Field label="Isi testimoni" htmlFor="t-body" error={errors.body?.message}>
            <Textarea rows={5} {...f("body")} {...form.register("body")} />
          </Field>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-28">
              <Field label="Urutan" htmlFor="t-order" error={errors.order?.message}>
                <Input inputMode="numeric" {...f("order")} {...form.register("order")} />
              </Field>
            </div>
            <CheckField id="t-isPublished" label="Tampilkan di beranda" className="pb-2" {...form.register("isPublished")} />
          </div>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Menyimpan…" : "Simpan testimoni"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Terbitkan testimoni siswa yang menunggu tinjauan (revisi RMED). */
export function PublishTestimonialButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await terbitkanTestimoni({ id });
          if (!r.ok) return void toast.error(r.error);
          toast.success("Testimoni diterbitkan di beranda.");
          router.refresh();
        })
      }
    >
      {pending ? "Menerbitkan…" : "Terbitkan"}
    </Button>
  );
}
