"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection } from "@/components/admin/form-fields";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { shouldAutoSlug, slugify } from "@/features/admin/form-rules";
import { hapusVideo, simpanVideo } from "@/features/admin/video-actions";
import { detectProvider, videoSchema, type VideoInput } from "@/features/admin/video-schema";

const providerLabel = { YOUTUBE: "YouTube", VIMEO: "Vimeo", EKSTERNAL: "Berkas video eksternal" } as const;

/** Form video pustaka (L.2.4). */
export function VideoForm({
  defaults,
  categories,
  usedInLessons,
}: {
  defaults: VideoInput;
  categories: { id: string; name: string }[];
  usedInLessons: number;
}) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(videoSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const url = useWatch({ control: form.control, name: "url" });
  const provider = detectProvider(url ?? "");
  const f = (name: keyof VideoInput) => ({ id: `v-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`v-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: VideoInput) => simpanVideo(v), (data) => {
    toast.success(defaults.id ? "Video disimpan." : "Video ditambahkan.");
    if (defaults.id) router.refresh();
    else router.push(`/admin/video/${data.id}`);
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <FormAlert message={error} />
      <FormSection title="Video">
        <Field label="Judul" htmlFor="v-title" error={errors.title?.message}>
          <Input autoComplete="off" {...f("title")} {...form.register("title", { onBlur: (e) => shouldAutoSlug(form.getValues("slug"), e) && form.setValue("slug", slugify(e.target.value)) })} />
        </Field>
        <Field label="Slug URL" htmlFor="v-slug" error={errors.slug?.message} hint="Alamat: /video/slug-ini">
          <Input autoComplete="off" {...f("slug")} {...form.register("slug")} />
        </Field>
        <Field
          label="URL video"
          htmlFor="v-url"
          error={errors.url?.message}
          hint={provider ? `Terdeteksi: ${providerLabel[provider]}.` : "YouTube (sebaiknya unlisted), Vimeo, atau berkas .mp4/.webm. Video tidak diunggah ke server."}
        >
          <Input type="url" inputMode="url" {...f("url")} {...form.register("url")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Durasi" htmlFor="v-duration" error={errors.duration?.message} hint="Mis. 12:30">
            <Input inputMode="numeric" {...f("duration")} {...form.register("duration")} />
          </Field>
          <Field label="Program" htmlFor="v-categoryId" error={errors.categoryId?.message}>
            <NativeSelect {...f("categoryId")} {...form.register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Kesulitan" htmlFor="v-difficulty" error={errors.difficulty?.message}>
            <NativeSelect {...f("difficulty")} {...form.register("difficulty")}>
              <option value="MUDAH">Mudah</option>
              <option value="SEDANG">Sedang</option>
              <option value="SULIT">Sulit</option>
            </NativeSelect>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mata pelajaran" htmlFor="v-subject" error={errors.subject?.message}>
            <Input autoComplete="off" {...f("subject")} {...form.register("subject")} />
          </Field>
          <Field label="Status" htmlFor="v-status" error={errors.status?.message} hint="Hanya video terbit yang tampil di pustaka.">
            <NativeSelect {...f("status")} {...form.register("status")}>
              <option value="DRAF">Draf</option>
              <option value="TERBIT">Terbit</option>
              <option value="ARSIP">Arsip</option>
            </NativeSelect>
          </Field>
        </div>
      </FormSection>
      <FormSection title="Isi">
        <Field label="Deskripsi" htmlFor="v-description" error={errors.description?.message}>
          <Textarea rows={4} {...f("description")} {...form.register("description")} />
        </Field>
        <Field label="Transkrip (opsional)" htmlFor="v-transcript" error={errors.transcript?.message} hint="Pisahkan paragraf dengan baris kosong (H.2.3).">
          <Textarea rows={6} {...f("transcript")} {...form.register("transcript")} />
        </Field>
      </FormSection>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : defaults.id ? "Simpan video" : "Tambah video"}
        </Button>
        {defaults.id && usedInLessons === 0 && (
          <DeleteButton
            label="Hapus video"
            title="Hapus video ini?"
            description="Video, progres tonton, catatan, dan diskusinya dihapus permanen."
            action={() => hapusVideo({ id: defaults.id })}
            redirectTo="/admin/video"
            successMessage="Video dihapus."
          />
        )}
      </div>
    </form>
  );
}
