"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormAlert, PasswordInput, PasswordStrengthMeter, useHydrated } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { EDUCATION_OPTIONS, EXAM_TARGETS } from "@/features/auth/schemas";
import { gantiPassword, simpanProfil } from "@/features/dashboard/actions";
import { gantiPasswordSchema, profilSchema, type GantiPasswordInput, type ProfilInput } from "@/features/dashboard/schemas";

/** Ubah data diri (F.1 Profil). */
export function ProfilForm({ email, defaults }: { email: string; defaults: ProfilInput }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const form = useForm<ProfilInput>({ resolver: zodResolver(profilSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const f = (name: keyof ProfilInput) => ({ id: name, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(name, errors[name]?.message) });

  return (
    <form
      method="post"
      noValidate
      className="flex max-w-2xl flex-col gap-5"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setError(undefined);
          const r = await simpanProfil(values);
          if (!r.ok) {
            setError(r.error);
            for (const [k, m] of Object.entries(r.fieldErrors ?? {})) form.setError(k as keyof ProfilInput, { message: m });
            return;
          }
          toast.success("Profil disimpan.");
          router.refresh();
        }),
      )}
    >
      {/* Input aktif setelah hydration: teks yang diketik lebih awal tidak tertimpa form. */}
      <fieldset disabled={!hydrated} className="contents">
        <FormAlert message={error} />
        <Field label="Nama lengkap" htmlFor="name" error={errors.name?.message}>
          <Input autoComplete="name" {...f("name")} {...form.register("name")} />
        </Field>
        <Field label="Email" htmlFor="email-profil" hint="Email tidak bisa diubah dari sini. Hubungi kami bila perlu menggantinya.">
          <Input id="email-profil" value={email} readOnly disabled />
        </Field>
        <Field label="Nomor WhatsApp" htmlFor="phone" error={errors.phone?.message}>
          <Input type="tel" autoComplete="tel" inputMode="tel" {...f("phone")} {...form.register("phone")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Jenjang pendidikan" htmlFor="educationLevel" error={errors.educationLevel?.message}>
            <NativeSelect {...f("educationLevel")} {...form.register("educationLevel")}>
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
            <NativeSelect {...f("examTarget")} {...form.register("examTarget")}>
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
            <Input autoComplete="organization" {...f("school")} {...form.register("school")} />
          </Field>
          <Field label="Kota (opsional)" htmlFor="city" error={errors.city?.message}>
            <Input autoComplete="address-level2" {...f("city")} {...form.register("city")} />
          </Field>
        </div>
        <Button type="submit" className="self-start" disabled={pending || !hydrated}>
          {pending ? "Menyimpan…" : "Simpan profil"}
        </Button>
      </fieldset>
    </form>
  );
}

/** Ganti password; akun Google tanpa password bisa membuat password pertama. */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const form = useForm<GantiPasswordInput>({
    resolver: zodResolver(gantiPasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });
  const f = (name: keyof GantiPasswordInput) => ({ id: name, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(name, errors[name]?.message) });

  return (
    <form
      method="post"
      noValidate
      className="flex max-w-md flex-col gap-5"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setError(undefined);
          const r = await gantiPassword(values);
          if (!r.ok) {
            setError(r.error);
            for (const [k, m] of Object.entries(r.fieldErrors ?? {})) form.setError(k as keyof GantiPasswordInput, { message: m });
            return;
          }
          form.reset();
          toast.success(hasPassword ? "Password diganti." : "Password dibuat. Kamu kini juga bisa masuk dengan email.");
        }),
      )}
    >
      {/* Input aktif setelah hydration: teks yang diketik lebih awal tidak tertimpa form. */}
      <fieldset disabled={!hydrated} className="contents">
        <FormAlert message={error} />
        {hasPassword && (
          <Field label="Password lama" htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <PasswordInput autoComplete="current-password" {...f("currentPassword")} {...form.register("currentPassword")} />
          </Field>
        )}
        <Field label="Password baru" htmlFor="password" error={errors.password?.message} hint="Minimal 8 karakter, memuat huruf dan angka.">
          <PasswordInput autoComplete="new-password" {...f("password")} {...form.register("password")} />
        </Field>
        <PasswordStrengthMeter password={password ?? ""} />
        <Field label="Ulangi password baru" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...f("confirmPassword")} {...form.register("confirmPassword")} />
        </Field>
        <Button type="submit" variant="outline" className="self-start" disabled={pending || !hydrated}>
          {pending ? "Menyimpan…" : hasPassword ? "Ganti password" : "Buat password"}
        </Button>
      </fieldset>
    </form>
  );
}
