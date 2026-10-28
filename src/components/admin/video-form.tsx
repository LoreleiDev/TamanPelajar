"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection } from "@/components/admin/form-fields";
import { SubjectSelect } from "@/components/admin/subject-select";
import { useAutoSlug } from "@/components/admin/use-auto-slug";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { hapusVideo, simpanVideo } from "@/features/admin/video-actions";
import { detectVideoDuration } from "@/features/admin/video-duration";
import { detectProvider, videoSchema, type VideoInput } from "@/features/admin/video-schema";
import { formatClock } from "@/lib/format";

const providerLabel = { YOUTUBE: "YouTube", VIMEO: "Vimeo", EKSTERNAL: "Berkas video eksternal" } as const;

/** Form video pustaka (L.2.4). */
export function VideoForm({
  defaults,
  categories,
  subjects,
  usedInLessons,
}: {
  defaults: VideoInput;
  categories: { id: string; name: string }[];
  subjects: string[];
  usedInLessons: number;
}) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(videoSchema), defaultValues: defaults });
  // Slug mengikuti judul/nama saat membuat data baru (revisi RMED).
  const autoSlug = useAutoSlug(form, "title", !defaults.id);
  const { errors } = form.formState;
  const url = useWatch({ control: form.control, name: "url" });
  const provider = detectProvider(url ?? "");
  const [durationState, setDurationState] = useState<"idle" | "loading" | "found" | "failed">("idle");

  // Durasi otomatis (revisi RMED): dibaca dari penyedia video setiap kali URL valid berubah.
  // Hanya untuk URL baru; durasi video yang sudah tersimpan tidak ditimpa saat form dibuka.
  useEffect(() => {
    const value = (url ?? "").trim();
    if (!detectProvider(value) || value === defaults.url) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setDurationState("loading");
      const sec = await detectVideoDuration(value);
      if (cancelled) return;
      if (sec) form.setValue("duration", formatClock(sec), { shouldValidate: form.formState.isSubmitted, shouldDirty: true });
      setDurationState(sec ? "found" : "failed");
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, defaults.url, form]);
  const durationHint = {
    idle: "Terisi otomatis dari URL video. Mis. 12:30",
    loading: "Membaca durasi dari video…",
    found: "Terisi otomatis dari video. Ubah bila perlu.",
    failed: "Durasi tidak terbaca otomatis; isi manual, mis. 12:30.",
  }[durationState];
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
          <Input autoComplete="off" {...f("title")} {...form.register("title")} />
        </Field>
        <Field label="Slug URL" htmlFor="v-slug" error={errors.slug?.message} hint="Alamat: /video/slug-ini">
          <Input autoComplete="off" {...f("slug")} {...form.register("slug")} onInput={autoSlug.onInput} />
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
          <Field label="Durasi" htmlFor="v-duration" error={errors.duration?.message} hint={durationHint}>
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
            <SubjectSelect subjects={subjects} current={defaults.subject} {...f("subject")} {...form.register("subject")} />
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
