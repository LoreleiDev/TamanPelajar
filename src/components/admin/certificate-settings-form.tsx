"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { MediaUploader, type MediaValue } from "@/components/admin/media-uploader";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { simpanPengaturanSertifikat } from "@/features/admin/practical-actions";
import { certificateSettingsSchema, type CertificateSettingsInput } from "@/features/certificate/schemas";

/** Judul sertifikat, nilai minimal kuis, instruksi, dan template tugas praktik (revisi RMED). */
export function CertificateSettingsForm({ defaults, template }: { defaults: CertificateSettingsInput; template: MediaValue | null }) {
  const router = useRouter();
  const [file, setFile] = useState<MediaValue | null>(template);
  const form = useForm<CertificateSettingsInput>({ resolver: zodResolver(certificateSettingsSchema) as never, defaultValues: defaults });
  const { errors } = form.formState;
  const id = (name: string) => `${name}-${defaults.id}`;
  const f = (name: keyof CertificateSettingsInput) => ({
    id: id(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": describedBy(id(name), errors[name]?.message),
  });
  const { pending, error, onSubmit } = useAdminSubmit(
    form,
    (v: CertificateSettingsInput) => simpanPengaturanSertifikat({ ...v, practicalTemplateId: file?.id ?? null }),
    () => {
      toast.success("Pengaturan sertifikat disimpan.");
      router.refresh();
    },
  );

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormAlert message={error} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Field label="Judul di sertifikat" htmlFor={id("title")} error={errors.title?.message}>
          <Input autoComplete="off" {...f("title")} {...form.register("title")} />
        </Field>
        <Field label="Nilai minimal" htmlFor={id("minScore")} error={errors.minScore?.message} hint="Rata-rata kuis, 0–100">
          <Input inputMode="numeric" {...f("minScore")} {...form.register("minScore")} />
        </Field>
      </div>
      <Field
        label="Instruksi tugas praktik"
        htmlFor={id("practicalInstructions")}
        error={errors.practicalInstructions?.message}
        hint="Jelaskan apa yang dikerjakan siswa dan isi folder Google Drive yang dikirim."
      >
        <Textarea rows={4} {...f("practicalInstructions")} {...form.register("practicalInstructions")} />
      </Field>
      <MediaUploader
        label="Template tugas"
        folder="sertifikat"
        kind="dokumen"
        value={file}
        onChange={setFile}
        hint="Hanya bisa diunduh peserta batch kelas ini."
      />
      <Button type="submit" variant="outline" disabled={pending} className="self-start">
        {pending ? "Menyimpan…" : "Simpan pengaturan"}
      </Button>
    </form>
  );
}
