"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kirimUlangVerifikasi, lupaPassword } from "@/features/auth/actions";
import { lupaPasswordSchema, type LupaPasswordInput } from "@/features/auth/schemas";

import { describedBy, Field, FormAlert, MailSentNotice } from "./form-parts";

const modes = {
  reset: {
    action: lupaPassword,
    submit: "Kirim tautan reset",
    sentTitle: "Cek email kamu",
    sentText: "Jika email itu terdaftar, kami sudah mengirim tautan untuk membuat password baru. Tautan berlaku 1 jam.",
    demoLabel: "Buat password baru sekarang",
  },
  verify: {
    action: kirimUlangVerifikasi,
    submit: "Kirim ulang tautan verifikasi",
    sentTitle: "Tautan verifikasi dikirim",
    sentText: "Jika email itu terdaftar dan belum diverifikasi, tautan baru sudah kami kirim. Tautan berlaku 24 jam.",
    demoLabel: "Verifikasi email sekarang",
  },
};

/** Form satu field email untuk lupa password (E.1.3) dan kirim ulang verifikasi (E.1.5). */
export function EmailRequestForm({ mode }: { mode: keyof typeof modes }) {
  const m = modes[mode];
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<{ demoLink?: string }>();
  const form = useForm<LupaPasswordInput>({ resolver: zodResolver(lupaPasswordSchema), defaultValues: { email: "" } });
  const emailError = form.formState.errors.email?.message;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(undefined);
      const result = await m.action(values);
      if (!result.ok) return setError(result.error);
      setSent(result.data);
    }),
  );

  if (sent) {
    return (
      <MailSentNotice title={m.sentTitle} description={<p>{m.sentText}</p>} demoLink={sent.demoLink} demoLabel={m.demoLabel}>
        <Button asChild variant="outline" size="lg">
          <Link href="/masuk">Kembali ke halaman masuk</Link>
        </Button>
      </MailSentNotice>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={error} />
      <Field label="Email akun" htmlFor="email" error={emailError}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(emailError)}
          aria-describedby={describedBy("email", emailError)}
          {...form.register("email")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Mengirim…" : m.submit}
      </Button>
    </form>
  );
}
