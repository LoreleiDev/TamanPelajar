"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CheckField, FormSection } from "@/components/admin/form-fields";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { simpanVoucher } from "@/features/admin/vouchers/actions";
import { voucherSchema, type VoucherInput, type VoucherOutput } from "@/features/admin/vouchers/schemas";

/** Form buat/ubah voucher (C.2.7). */
export function VoucherForm({ defaults }: { defaults: VoucherInput }) {
  const router = useRouter();
  const form = useForm<VoucherInput, unknown, VoucherOutput>({ resolver: zodResolver(voucherSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const type = useWatch({ control: form.control, name: "discountType" });
  const f = (name: keyof VoucherInput) => ({ id: `v-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`v-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, simpanVoucher, (data) => {
    toast.success(defaults.id ? "Voucher disimpan." : "Voucher dibuat.");
    if (defaults.id) router.refresh();
    else router.push(`/admin/voucher/${data.id}`);
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <FormAlert message={error} />
      <FormSection title="Identitas">
        <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <Field label="Kode" htmlFor="v-code" error={errors.code?.message} hint="Huruf besar otomatis.">
            <Input autoComplete="off" className="uppercase" {...f("code")} {...form.register("code")} />
          </Field>
          <Field label="Keterangan" htmlFor="v-description" error={errors.description?.message} hint="Tampil di checkout setelah kode dipakai.">
            <Input autoComplete="off" {...f("description")} {...form.register("description")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Potongan">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Jenis" htmlFor="v-discountType" error={errors.discountType?.message}>
            <NativeSelect {...f("discountType")} {...form.register("discountType")}>
              <option value="PERSEN">Persen (%)</option>
              <option value="NOMINAL">Nominal (Rp)</option>
            </NativeSelect>
          </Field>
          <Field label={type === "PERSEN" ? "Nilai (%)" : "Nilai (Rp)"} htmlFor="v-value" error={errors.value?.message}>
            <Input inputMode="numeric" {...f("value")} {...form.register("value")} />
          </Field>
          <Field
            label="Potongan maksimal (Rp)"
            htmlFor="v-maxDiscount"
            error={errors.maxDiscount?.message}
            hint={type === "PERSEN" ? "Kosongkan bila tanpa batas." : "Hanya untuk jenis persen."}
          >
            <Input inputMode="numeric" {...f("maxDiscount")} {...form.register("maxDiscount")} />
          </Field>
        </div>
        <Field label="Minimum belanja (Rp)" htmlFor="v-minPurchase" error={errors.minPurchase?.message} hint="Isi 0 bila tanpa minimum.">
          <Input inputMode="numeric" className="sm:max-w-56" {...f("minPurchase")} {...form.register("minPurchase")} />
        </Field>
      </FormSection>

      <FormSection title="Batas pemakaian">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kuota total" htmlFor="v-quota" error={errors.quota?.message} hint="Kosongkan bila tanpa batas.">
            <Input inputMode="numeric" {...f("quota")} {...form.register("quota")} />
          </Field>
          <Field label="Batas per pengguna" htmlFor="v-perUserLimit" error={errors.perUserLimit?.message}>
            <Input inputMode="numeric" {...f("perUserLimit")} {...form.register("perUserLimit")} />
          </Field>
          <Field label="Mulai berlaku (WIB)" htmlFor="v-startsAt" error={errors.startsAt?.message}>
            <Input type="datetime-local" {...f("startsAt")} {...form.register("startsAt")} />
          </Field>
          <Field label="Berakhir (WIB)" htmlFor="v-endsAt" error={errors.endsAt?.message}>
            <Input type="datetime-local" {...f("endsAt")} {...form.register("endsAt")} />
          </Field>
        </div>
        <CheckField id="v-isActive" label="Voucher aktif" hint="Voucher nonaktif ditolak di checkout walau masih dalam masa berlaku." {...form.register("isActive")} />
      </FormSection>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Menyimpan…" : defaults.id ? "Simpan perubahan" : "Buat voucher"}
      </Button>
    </form>
  );
}
