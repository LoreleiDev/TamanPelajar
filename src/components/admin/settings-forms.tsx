"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { contactSettingSchema, faqSettingSchema, type ContactSettingInput, type FaqSettingInput } from "@/features/admin/setting-schema";
import { simpanFaqBeranda, simpanKontak } from "@/features/admin/site-actions";

/** FAQ beranda (D.1.8). */
export function FaqSettingsForm({ defaults }: { defaults: FaqSettingInput }) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(faqSettingSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const items = useFieldArray({ control: form.control, name: "items" });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: FaqSettingInput) => simpanFaqBeranda(v), () => {
    toast.success("FAQ beranda disimpan.");
    router.refresh();
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-4">
      <FormAlert message={error} />
      <ol className="flex flex-col gap-3">
        {items.fields.map((field, i) => (
          <li key={field.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex flex-col gap-2">
              <label htmlFor={`faq-${i}-q`} className="text-sm font-semibold">
                Pertanyaan {i + 1}
              </label>
              <Input id={`faq-${i}-q`} aria-invalid={Boolean(errors.items?.[i]?.question)} {...form.register(`items.${i}.question`)} />
              {errors.items?.[i]?.question && <p className="text-sm text-destructive">{errors.items[i]?.question?.message}</p>}
              <label htmlFor={`faq-${i}-a`} className="text-sm font-semibold">
                Jawaban
              </label>
              <Textarea id={`faq-${i}-a`} rows={2} aria-invalid={Boolean(errors.items?.[i]?.answer)} {...form.register(`items.${i}.answer`)} />
              {errors.items?.[i]?.answer && <p className="text-sm text-destructive">{errors.items[i]?.answer?.message}</p>}
            </div>
            <div className="flex gap-1 sm:flex-col">
              <Button type="button" size="icon" variant="ghost" aria-label={`Naikkan pertanyaan ${i + 1}`} disabled={i === 0} onClick={() => items.move(i, i - 1)}>
                <ArrowUp />
              </Button>
              <Button type="button" size="icon" variant="ghost" aria-label={`Turunkan pertanyaan ${i + 1}`} disabled={i === items.fields.length - 1} onClick={() => items.move(i, i + 1)}>
                <ArrowDown />
              </Button>
              <Button type="button" size="icon" variant="ghost" aria-label={`Hapus pertanyaan ${i + 1}`} className="text-muted-foreground hover:text-destructive" onClick={() => items.remove(i)}>
                <X />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {errors.items?.message && (
        <p role="alert" className="text-sm text-destructive">
          {errors.items.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {items.fields.length < 12 && (
          <Button type="button" variant="outline" onClick={() => items.append({ question: "", answer: "" })}>
            <Plus data-icon="inline-start" />
            Tambah pertanyaan
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan FAQ"}
        </Button>
      </div>
    </form>
  );
}

/** Kontak di halaman Hubungi kami. */
export function ContactSettingsForm({ defaults }: { defaults: ContactSettingInput }) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(contactSettingSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const f = (name: keyof ContactSettingInput) => ({ id: `k-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`k-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: ContactSettingInput) => simpanKontak(v), () => {
    toast.success("Kontak disimpan.");
    router.refresh();
  });
  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      <FormAlert message={error} />
      <Field label="Email layanan" htmlFor="k-email" error={errors.email?.message}>
        <Input type="email" {...f("email")} {...form.register("email")} />
      </Field>
      <Field label="Jam layanan" htmlFor="k-jamLayanan" error={errors.jamLayanan?.message} hint="Mis. Senin–Jumat, 09.00–17.00 WIB">
        <Input {...f("jamLayanan")} {...form.register("jamLayanan")} />
      </Field>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Menyimpan…" : "Simpan kontak"}
      </Button>
    </form>
  );
}
