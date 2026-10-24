"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daftar } from "@/features/auth/actions";
import { daftarSchema, EDUCATION_OPTIONS, EXAM_TARGETS, type DaftarInput } from "@/features/auth/schemas";

import { describedBy, Field, FormAlert, MailSentNotice, PasswordInput, PasswordStrengthMeter } from "./form-parts";
import { NativeSelect } from "./native-select";

/** Form pendaftaran (E.1.1, E.2.1–E.2.7, E.3.1–E.3.4). */
export function DaftarForm({ callbackUrl }: { callbackUrl: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<{ email: string; demoLink?: string }>();
  const form = useForm<DaftarInput>({
    resolver: zodResolver(daftarSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      educationLevel: "" as DaftarInput["educationLevel"],
      examTarget: "" as DaftarInput["examTarget"],
      terms: false as true,
    },
  });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(undefined);
      const result = await daftar(values);
      if (!result.ok) {
        setError(result.error);
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof DaftarInput, { message });
        }
        return;
      }
      setSent(result.data);
    }),
  );

  if (sent) {
    return (
      <MailSentNotice
        title="Cek email untuk verifikasi"
        description={
          <p>
            Kami mengirim tautan verifikasi ke <strong className="text-foreground">{sent.email}</strong>. Buka tautan itu, lalu
            masuk dengan email dan password yang baru dibuat. Tautan berlaku 24 jam.
          </p>
        }
        demoLink={sent.demoLink}
        demoLabel="Verifikasi email sekarang"
      >
        <Button asChild variant="outline" size="lg">
          <Link href={`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Ke halaman masuk</Link>
        </Button>
      </MailSentNotice>
    );
  }

  const field = (name: keyof DaftarInput) => ({
    id: name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": describedBy(name, errors[name]?.message),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={error} />
      <Field label="Nama lengkap" htmlFor="name" error={errors.name?.message}>
        <Input autoComplete="name" {...field("name")} {...form.register("name")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" {...field("email")} {...form.register("email")} />
        </Field>
        <Field label="Nomor WhatsApp" htmlFor="phone" error={errors.phone?.message}>
          <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="08xxxxxxxxxx" {...field("phone")} {...form.register("phone")} />
        </Field>
      </div>
      <Field label="Password" htmlFor="password" error={errors.password?.message} hint="Minimal 8 karakter, memuat huruf dan angka.">
        <PasswordInput autoComplete="new-password" {...field("password")} {...form.register("password")} />
      </Field>
      <PasswordStrengthMeter password={password} />
      <Field label="Ulangi password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput autoComplete="new-password" {...field("confirmPassword")} {...form.register("confirmPassword")} />
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
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2.5 text-[0.9375rem]">
          <input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" {...field("terms")} {...form.register("terms")} />
          <span>
            Saya menyetujui{" "}
            <Link href="/syarat-ketentuan" target="_blank" className="font-semibold text-primary underline underline-offset-4">
              syarat dan ketentuan
            </Link>{" "}
            serta{" "}
            <Link href="/kebijakan-privasi" target="_blank" className="font-semibold text-primary underline underline-offset-4">
              kebijakan privasi
            </Link>
            .
          </span>
        </label>
        {errors.terms && (
          <p id="terms-error" className="text-sm text-destructive" role="alert">
            {errors.terms.message}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Membuat akun…" : "Buat akun"}
      </Button>
    </form>
  );
}
