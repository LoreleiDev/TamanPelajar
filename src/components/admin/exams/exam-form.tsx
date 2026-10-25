"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CheckField, FormSection } from "@/components/admin/form-fields";
import { MediaUploader, type MediaValue } from "@/components/admin/media-uploader";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { simpanTryout } from "@/features/admin/exams/actions";
import { examSchema, type ExamInput, type ExamOutput } from "@/features/admin/exams/schemas";
import { shouldAutoSlug, slugify } from "@/features/admin/form-rules";

/** Pengaturan tryout (M.6.1–M.6.6). */
export function ExamForm({ defaults, categories, image }: { defaults: ExamInput; categories: { id: string; name: string }[]; image: MediaValue | null }) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaValue | null>(image);
  const form = useForm<ExamInput, unknown, ExamOutput>({ resolver: zodResolver(examSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const showDiscussion = useWatch({ control: form.control, name: "showDiscussion" });
  const f = (name: keyof ExamInput) => ({ id: `e-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`e-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, simpanTryout, (data) => {
    toast.success(defaults.id ? "Pengaturan tryout disimpan." : "Tryout dibuat. Tambahkan subtes dan soal.");
    if (defaults.id) router.refresh();
    else router.push(`/admin/tryout/${data.id}?tab=soal`);
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <FormAlert message={error} />
      <FormSection title="Identitas">
        <Field label="Nama tryout" htmlFor="e-title" error={errors.title?.message}>
          <Input
            autoComplete="off"
            {...f("title")}
            {...form.register("title", {
              onBlur: (e) => {
                if (shouldAutoSlug(form.getValues("slug"), e)) form.setValue("slug", slugify(e.target.value));
              },
            })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug URL" htmlFor="e-slug" error={errors.slug?.message} hint="Alamat: /tryout/slug-ini">
            <Input autoComplete="off" {...f("slug")} {...form.register("slug")} />
          </Field>
          <Field label="Kategori" htmlFor="e-categoryId" error={errors.categoryId?.message}>
            <NativeSelect {...f("categoryId")} {...form.register("categoryId")}>
              <option value="" disabled>
                Pilih kategori
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field label="Deskripsi" htmlFor="e-description" error={errors.description?.message}>
          <Textarea rows={3} {...f("description")} {...form.register("description")} />
        </Field>
        <Field label="Aturan tambahan (opsional)" htmlFor="e-rules" error={errors.rules?.message} hint="Tampil di halaman petunjuk, satu aturan per baris.">
          <Textarea rows={3} {...f("rules")} {...form.register("rules")} />
        </Field>
        <MediaUploader
          label="Gambar (opsional)"
          folder="produk"
          kind="image"
          value={media}
          onChange={(v) => {
            setMedia(v);
            form.setValue("imageId", v?.id ?? null, { shouldDirty: true });
          }}
        />
      </FormSection>

      <FormSection title="Waktu dan percobaan" description="Kosongkan jadwal bila tryout selalu terbuka. Durasi per subtes diatur di tab Subtes dan soal.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Durasi total (menit)" htmlFor="e-durationMin" error={errors.durationMin?.message}>
            <Input inputMode="numeric" {...f("durationMin")} {...form.register("durationMin")} />
          </Field>
          <Field label="Jumlah percobaan per siswa" htmlFor="e-maxAttempts" error={errors.maxAttempts?.message}>
            <Input inputMode="numeric" {...f("maxAttempts")} {...form.register("maxAttempts")} />
          </Field>
          <Field label="Jadwal buka (WIB)" htmlFor="e-opensAt" error={errors.opensAt?.message}>
            <Input type="datetime-local" {...f("opensAt")} {...form.register("opensAt")} />
          </Field>
          <Field label="Jadwal tutup (WIB)" htmlFor="e-closesAt" error={errors.closesAt?.message}>
            <Input type="datetime-local" {...f("closesAt")} {...form.register("closesAt")} />
          </Field>
        </div>
        <CheckField id="e-shuffleQuestions" label="Acak urutan soal" hint="Urutan per siswa tetap sama setelah refresh." {...form.register("shuffleQuestions")} />
        <CheckField id="e-shuffleOptions" label="Acak urutan pilihan jawaban" hint="Soal benar/salah tidak diacak." {...form.register("shuffleOptions")} />
      </FormSection>

      <FormSection title="Penilaian" description="Skor per bobot 1. Skor salah nol atau negatif; jawaban kosong selalu nol.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Skor benar" htmlFor="e-correctScore" error={errors.correctScore?.message}>
            <Input inputMode="decimal" {...f("correctScore")} {...form.register("correctScore")} />
          </Field>
          <Field label="Skor salah" htmlFor="e-wrongScore" error={errors.wrongScore?.message}>
            <Input inputMode="decimal" {...f("wrongScore")} {...form.register("wrongScore")} />
          </Field>
          <Field label="Passing grade total" htmlFor="e-passingGrade" error={errors.passingGrade?.message}>
            <Input inputMode="decimal" {...f("passingGrade")} {...form.register("passingGrade")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Pembahasan">
        <CheckField id="e-showDiscussion" label="Tampilkan pembahasan ke siswa" {...form.register("showDiscussion")} />
        {showDiscussion && (
          <Field
            label="Pembahasan dibuka (WIB, opsional)"
            htmlFor="e-discussionOpensAt"
            error={errors.discussionOpensAt?.message}
            hint="Kosongkan agar pembahasan langsung terbuka setelah siswa mengumpulkan."
          >
            <Input type="datetime-local" className="sm:max-w-64" {...f("discussionOpensAt")} {...form.register("discussionOpensAt")} />
          </Field>
        )}
      </FormSection>

      <FormSection title="Publikasi">
        <Field label="Status" htmlFor="e-status" error={errors.status?.message} hint="Hanya tryout terbit yang tampil di halaman publik.">
          <NativeSelect className="sm:max-w-56" {...f("status")} {...form.register("status")}>
            <option value="DRAF">Draf</option>
            <option value="TERBIT">Terbit</option>
            <option value="ARSIP">Arsip</option>
          </NativeSelect>
        </Field>
      </FormSection>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Menyimpan…" : defaults.id ? "Simpan pengaturan" : "Buat tryout"}
      </Button>
    </form>
  );
}
