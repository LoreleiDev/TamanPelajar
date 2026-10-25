"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, UserRoundCheck, UserRoundX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { aturStatusPengguna, resetPasswordPengguna, ubahPengguna } from "@/features/admin/users/actions";
import { userUpdateSchema, type UserUpdateInput } from "@/features/admin/users/schemas";

/** Ubah nama, email, dan role pengguna (M.3). */
export function UserEditForm({ user, isSelf }: { user: UserUpdateInput; isSelf: boolean }) {
  const router = useRouter();
  const form = useForm<UserUpdateInput>({ resolver: zodResolver(userUpdateSchema), defaultValues: user });
  const { errors } = form.formState;
  const f = (name: keyof UserUpdateInput) => ({ id: `ubah-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`ubah-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, ubahPengguna, () => {
    toast.success("Data pengguna disimpan.");
    router.refresh();
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      <FormAlert message={error} />
      <Field label="Nama lengkap" htmlFor="ubah-name" error={errors.name?.message}>
        <Input autoComplete="off" {...f("name")} {...form.register("name")} />
      </Field>
      <Field label="Email" htmlFor="ubah-email" error={errors.email?.message}>
        <Input type="email" autoComplete="off" {...f("email")} {...form.register("email")} />
      </Field>
      {isSelf ? (
        <p className="text-sm text-muted-foreground">Role: Administrator. Role akunmu sendiri tidak bisa diubah dari sini.</p>
      ) : (
        <Field label="Role" htmlFor="ubah-role" error={errors.role?.message} hint="Administrator bisa membuka seluruh panel admin.">
          <NativeSelect {...f("role")} {...form.register("role")}>
            <option value="USER">Siswa</option>
            <option value="ADMIN">Administrator</option>
          </NativeSelect>
        </Field>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}

/** Nonaktifkan/aktifkan akun dan kirim tautan reset password, masing-masing dengan konfirmasi. */
export function UserAccountActions({ id, name, email, active, isSelf }: { id: string; name: string; email: string; active: boolean; isSelf: boolean }) {
  const router = useRouter();
  const [demoLink, setDemoLink] = useState<string>();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <ConfirmDialog
          trigger={
            <Button variant="outline">
              <KeyRound data-icon="inline-start" />
              Kirim tautan reset password
            </Button>
          }
          title="Kirim tautan reset password?"
          description={`Tautan berlaku 60 menit dikirim ke ${email}. Kunci login karena salah password juga dibuka.`}
          confirmLabel="Kirim tautan"
          onConfirm={async () => {
            const r = await resetPasswordPengguna({ id });
            if (!r.ok) return void toast.error(r.error);
            setDemoLink(r.data.demoLink);
            toast.success("Tautan reset password dikirim.");
          }}
        />
        {!isSelf &&
          (active ? (
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <UserRoundX data-icon="inline-start" />
                  Nonaktifkan akun
                </Button>
              }
              title={`Nonaktifkan akun ${name}?`}
              description="Pengguna langsung keluar dan tidak bisa masuk sampai akunnya diaktifkan lagi. Data belajar dan transaksi tetap tersimpan."
              confirmLabel="Nonaktifkan"
              destructive
              onConfirm={async () => {
                const r = await aturStatusPengguna({ id, active: false });
                if (!r.ok) return void toast.error(r.error);
                toast.success("Akun dinonaktifkan.");
                router.refresh();
              }}
            />
          ) : (
            <ConfirmDialog
              trigger={
                <Button variant="outline">
                  <UserRoundCheck data-icon="inline-start" />
                  Aktifkan akun
                </Button>
              }
              title={`Aktifkan akun ${name}?`}
              description="Pengguna bisa masuk dan mengakses program aktifnya lagi."
              confirmLabel="Aktifkan"
              onConfirm={async () => {
                const r = await aturStatusPengguna({ id, active: true });
                if (!r.ok) return void toast.error(r.error);
                toast.success("Akun diaktifkan.");
                router.refresh();
              }}
            />
          ))}
      </div>
      {demoLink && (
        <div role="status" className="rounded-xl bg-accent p-4 text-sm">
          <p className="font-semibold">Mode demo</p>
          <p className="mt-1 text-muted-foreground">Email tidak benar-benar dikirim. Tautan untuk pengguna:</p>
          <a href={demoLink} className="mt-2 inline-block font-semibold break-all text-primary underline underline-offset-4">
            {demoLink}
          </a>
        </div>
      )}
    </div>
  );
}
