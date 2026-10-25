"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormAlert, PasswordInput } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { buatPengguna } from "@/features/admin/users/actions";
import { userCreateSchema, type UserCreateInput } from "@/features/admin/users/schemas";

/** Tambah pengguna (M.3): siswa atau administrator dengan password awal. */
export function UserCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { name: "", email: "", role: "USER", password: "" },
  });
  const { errors } = form.formState;
  const f = (name: keyof UserCreateInput) => ({ id: `baru-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`baru-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, buatPengguna, (data) => {
    toast.success("Pengguna ditambahkan.");
    setOpen(false);
    form.reset();
    router.push(`/admin/pengguna/${data.id}`);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Tambah pengguna
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">Tambah pengguna</DialogTitle>
          <DialogDescription>Berikan password awal kepada pengguna; mereka bisa menggantinya dari halaman profil.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />
          <Field label="Nama lengkap" htmlFor="baru-name" error={errors.name?.message}>
            <Input autoComplete="off" {...f("name")} {...form.register("name")} />
          </Field>
          <Field label="Email" htmlFor="baru-email" error={errors.email?.message}>
            <Input type="email" autoComplete="off" {...f("email")} {...form.register("email")} />
          </Field>
          <Field label="Role" htmlFor="baru-role" error={errors.role?.message}>
            <NativeSelect {...f("role")} {...form.register("role")}>
              <option value="USER">Siswa</option>
              <option value="ADMIN">Administrator</option>
            </NativeSelect>
          </Field>
          <Field label="Password awal" htmlFor="baru-password" error={errors.password?.message} hint="Minimal 8 karakter, memuat huruf dan angka.">
            <PasswordInput autoComplete="new-password" {...f("password")} {...form.register("password")} />
          </Field>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Menyimpan…" : "Simpan pengguna"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
