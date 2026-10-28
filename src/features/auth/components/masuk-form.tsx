"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { masuk } from "@/features/auth/actions";
import { masukSchema, type MasukInput } from "@/features/auth/schemas";

import { describedBy, Field, FormAlert, PasswordInput, useHydrated } from "./form-parts";

/** Form masuk (E.1.2, E.3.1–E.3.2, E.3.4). */
export function MasukForm({ callbackUrl, initialError }: { callbackUrl: string; initialError?: string }) {
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const [error, setError] = useState<{ message: string; code?: string } | undefined>(
    initialError ? { message: initialError } : undefined,
  );
  const form = useForm<MasukInput>({ resolver: zodResolver(masukSchema), defaultValues: { email: "", password: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(undefined);
      const result = await masuk({ ...values, callbackUrl });
      if (!result.ok) {
        setError({ message: result.error, code: result.code });
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof MasukInput, { message });
        }
        return;
      }
      // Navigasi penuh, bukan router.replace: header, sesi di client, dan cache router lama ikut
      // dimuat ulang sehingga halaman tujuan (mis. panel admin) langsung tampil sebagai akun baru.
      window.location.assign(result.data.redirectTo);
    }),
  );

  return (
    <form onSubmit={onSubmit} method="post" noValidate className="flex flex-col gap-5">
      {/* Input aktif setelah hydration: teks yang diketik lebih awal tidak tertimpa form. */}
      <fieldset disabled={!hydrated} className="contents">
        <FormAlert message={error?.message}>
          {error?.code === "unverified" && (
            <Link href="/verifikasi-email" className="mt-1 block font-semibold underline underline-offset-4">
              Kirim ulang tautan verifikasi
            </Link>
          )}
        </FormAlert>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email", errors.email?.message)}
            {...form.register("email")}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy("password", errors.password?.message)}
            {...form.register("password")}
          />
        </Field>
        <Link href="/lupa-password" className="-mt-2 self-end text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Lupa password?
        </Link>
        <Button type="submit" size="lg" disabled={pending || !hydrated}>
          {pending ? "Memeriksa…" : "Masuk"}
        </Button>
      </fieldset>
    </form>
  );
}
