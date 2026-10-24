"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { resetPassword } from "@/features/auth/actions";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schemas";

import { describedBy, Field, FormAlert, PasswordInput, PasswordStrengthMeter, useHydrated } from "./form-parts";

/** Form password baru dari tautan email (E.1.4). */
export function ResetPasswordForm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(undefined);
      const result = await resetPassword(values);
      if (!result.ok) {
        setError(result.error);
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof ResetPasswordInput, { message });
        }
        return;
      }
      setDone(true);
    }),
  );

  if (done) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <CircleCheck className="size-10 text-primary" aria-hidden="true" />
        <h1 className="text-heading">Password berhasil diganti</h1>
        <p className="text-muted-foreground">Masuk dengan password baru. Sesi di perangkat lain tetap aktif sampai kedaluwarsa.</p>
        <Button asChild size="lg">
          <Link href="/masuk">Masuk sekarang</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} method="post" noValidate className="flex flex-col gap-5">
      <FormAlert message={error} />
      <Field label="Password baru" htmlFor="password" error={errors.password?.message} hint="Minimal 8 karakter, memuat huruf dan angka.">
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={describedBy("password", errors.password?.message)}
          {...form.register("password")}
        />
      </Field>
      <PasswordStrengthMeter password={password} />
      <Field label="Ulangi password baru" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={describedBy("confirmPassword", errors.confirmPassword?.message)}
          {...form.register("confirmPassword")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending || !hydrated}>
        {pending ? "Menyimpan…" : "Simpan password baru"}
      </Button>
    </form>
  );
}
