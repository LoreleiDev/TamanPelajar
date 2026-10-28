"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckField, FormSection } from "@/components/admin/form-fields";
import { SubjectSelect } from "@/components/admin/subject-select";
import { useAutoSlug } from "@/components/admin/use-auto-slug";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { simpanKelas } from "@/features/admin/courses/actions";
import { courseSchema, type CourseInput } from "@/features/admin/courses/schemas";

/** Pengaturan kelas (L.2.1). */
export function CourseForm({ defaults, categories, subjects }: { defaults: CourseInput; categories: { id: string; name: string }[]; subjects: string[] }) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(courseSchema), defaultValues: defaults });
  // Slug mengikuti judul/nama saat membuat data baru (revisi RMED).
  const autoSlug = useAutoSlug(form, "title", !defaults.id);
  const { errors } = form.formState;
  const f = (name: keyof CourseInput) => ({ id: `c-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`c-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: CourseInput) => simpanKelas(v), (data) => {
    toast.success(defaults.id ? "Kelas disimpan." : "Kelas dibuat. Tambahkan bab dan materi.");
    if (defaults.id) router.refresh();
    else router.push(`/admin/kelas/${data.id}?tab=kurikulum`);
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <FormAlert message={error} />
      <FormSection title="Identitas">
        <Field label="Judul kelas" htmlFor="c-title" error={errors.title?.message}>
          <Input autoComplete="off" {...f("title")} {...form.register("title")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug URL" htmlFor="c-slug" error={errors.slug?.message} hint="Alamat: /kelas/slug-ini">
            <Input autoComplete="off" {...f("slug")} {...form.register("slug")} onInput={autoSlug.onInput} />
          </Field>
          <Field label="Program" htmlFor="c-categoryId" error={errors.categoryId?.message}>
            <NativeSelect {...f("categoryId")} {...form.register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Mata pelajaran" htmlFor="c-subject" error={errors.subject?.message}>
            <SubjectSelect subjects={subjects} current={defaults.subject} {...f("subject")} {...form.register("subject")} />
          </Field>
          <Field label="Tingkat" htmlFor="c-level" error={errors.level?.message}>
            <NativeSelect {...f("level")} {...form.register("level")}>
              <option value="MUDAH">Dasar</option>
              <option value="SEDANG">Menengah</option>
              <option value="SULIT">Lanjutan</option>
            </NativeSelect>
          </Field>
        </div>
        <Field label="Ringkasan" htmlFor="c-summary" error={errors.summary?.message} hint="Satu sampai dua kalimat untuk kartu kelas.">
          <Textarea rows={2} {...f("summary")} {...form.register("summary")} />
        </Field>
        <Field label="Deskripsi" htmlFor="c-description" error={errors.description?.message}>
          <Textarea rows={5} {...f("description")} {...form.register("description")} />
        </Field>
      </FormSection>
      <FormSection title="Aturan belajar">
        <CheckField
          id="c-sequentialLock"
          label="Kunci materi berurutan"
          hint="Materi berikutnya terbuka setelah materi sebelumnya ditandai selesai (G.4.3)."
          {...form.register("sequentialLock")}
        />
        <CheckField
          id="c-certificate"
          label="Terbitkan sertifikat"
          hint="Siswa mendapat sertifikat bernomor setelah menyelesaikan semua materi (G.4.6)."
          {...form.register("certificate")}
        />
        {errors.certificate && (
          <p role="alert" className="text-sm text-destructive">
            {errors.certificate.message}
          </p>
        )}
      </FormSection>
      <FormSection title="Publikasi">
        <Field label="Status" htmlFor="c-status" error={errors.status?.message} hint="Hanya kelas terbit yang tampil di katalog.">
          <NativeSelect className="sm:max-w-56" {...f("status")} {...form.register("status")}>
            <option value="DRAF">Draf</option>
            <option value="TERBIT">Terbit</option>
            <option value="ARSIP">Arsip</option>
          </NativeSelect>
        </Field>
      </FormSection>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Menyimpan…" : defaults.id ? "Simpan kelas" : "Buat kelas"}
      </Button>
    </form>
  );
}
