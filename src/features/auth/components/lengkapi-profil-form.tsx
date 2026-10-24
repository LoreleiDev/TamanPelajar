"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lengkapiProfil } from "@/features/auth/actions";
import { EDUCATION_OPTIONS, EXAM_TARGETS, lengkapiProfilSchema, type LengkapiProfilInput } from "@/features/auth/schemas";

import { describedBy, Field, FormAlert, useHydrated } from "./form-parts";
import { NativeSelect } from "./native-select";

/** Lengkapi profil (E.1.6). */
export function LengkapiProfilForm({
  callbackUrl,
  defaults,
}: {
  callbackUrl: string;
  defaults: Partial<LengkapiProfilInput>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const [error, setError] = useState<string>();
  const form = useForm<LengkapiProfilInput>({
    resolver: zodResolver(lengkapiProfilSchema),
    defaultValues: {
      phone: defaults.phone ?? "",
      educationLevel: defaults.educationLevel ?? ("" as LengkapiProfilInput["educationLevel"]),
      examTarget: defaults.examTarget ?? ("" as LengkapiProfilInput["examTarget"]),
      school: defaults.school ?? "",
      city: defaults.city ?? "",
    },
  });
  const { errors } = form.formState;
  const field = (name: keyof LengkapiProfilInput) => ({
    id: name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": describedBy(name, errors[name]?.message),
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(undefined);
      const result = await lengkapiProfil({ ...values, callbackUrl });
      if (!result.ok) {
        setError(result.error);
        for (const [f, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(f as keyof LengkapiProfilInput, { message });
        }
        return;
      }
      toast.success("Profil disimpan.");
      router.replace(result.data.redirectTo);
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} method="post" noValidate className="flex flex-col gap-5">
      <FormAlert message={error} />
      <Field label="Nomor WhatsApp" htmlFor="phone" error={errors.phone?.message}>
        <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="08xxxxxxxxxx" {...field("phone")} {...form.register("phone")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Jenjang pendidikan" htmlFor="educationLevel" error={errors.educationLevel?.message}>
          <NativeSelect {...field("educationLevel")} {...form.register("educationLevel")}>
            <option value="" disabled>
              Pilih jenjang
            </option>
            {EDUCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Target ujian" htmlFor="examTarget" error={errors.examTarget?.message}>
          <NativeSelect {...field("examTarget")} {...form.register("examTarget")}>
            <option value="" disabled>
              Pilih target
            </option>
            {EXAM_TARGETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Sekolah atau kampus (opsional)" htmlFor="school" error={errors.school?.message}>
          <Input autoComplete="organization" {...field("school")} {...form.register("school")} />
        </Field>
        <Field label="Kota (opsional)" htmlFor="city" error={errors.city?.message}>
          <Input autoComplete="address-level2" {...field("city")} {...form.register("city")} />
        </Field>
      </div>
      <Button type="submit" size="lg" disabled={pending || !hydrated}>
        {pending ? "Menyimpan…" : "Simpan dan lanjutkan"}
      </Button>
    </form>
  );
}
