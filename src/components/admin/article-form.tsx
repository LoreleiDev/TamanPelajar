"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection } from "@/components/admin/form-fields";
import { MediaUploader, type MediaValue } from "@/components/admin/media-uploader";
import { useAutoSlug } from "@/components/admin/use-auto-slug";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { hapusArtikel, simpanArtikel } from "@/features/article/actions";
import { ARTICLE_CATEGORIES, articleCategoryLabel, articleSchema, type ArticleInput } from "@/features/article/schemas";

/** Form artikel dan pengumuman (D.4, C.2.8). */
export function ArticleForm({ defaults, cover }: { defaults: ArticleInput; cover: MediaValue | null }) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaValue | null>(cover);
  const form = useForm({ resolver: zodResolver(articleSchema), defaultValues: defaults });
  // Slug mengikuti judul/nama saat membuat data baru (revisi RMED).
  const autoSlug = useAutoSlug(form, "title", !defaults.id);
  const { errors } = form.formState;
  const f = (name: keyof ArticleInput) => ({ id: `a-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`a-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: ArticleInput) => simpanArtikel(v), (data) => {
    toast.success(defaults.id ? "Artikel disimpan." : "Artikel dibuat.");
    if (defaults.id) router.refresh();
    else router.push(`/admin/informasi/${data.id}`);
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <FormAlert message={error} />
      <FormSection title="Artikel">
        <Field label="Judul" htmlFor="a-title" error={errors.title?.message}>
          <Input autoComplete="off" {...f("title")} {...form.register("title")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug URL" htmlFor="a-slug" error={errors.slug?.message} hint="Alamat: /informasi/slug-ini">
            <Input autoComplete="off" {...f("slug")} {...form.register("slug")} onInput={autoSlug.onInput} />
          </Field>
          <Field label="Kategori" htmlFor="a-category" error={errors.category?.message}>
            <NativeSelect {...f("category")} {...form.register("category")}>
              {ARTICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {articleCategoryLabel[c]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field label="Ringkasan" htmlFor="a-excerpt" error={errors.excerpt?.message} hint="Tampil di daftar artikel dan pratinjau tautan.">
          <Textarea rows={2} {...f("excerpt")} {...form.register("excerpt")} />
        </Field>
        <MediaUploader
          label="Gambar sampul (opsional)"
          folder="artikel"
          kind="image"
          value={media}
          onChange={(v) => {
            setMedia(v);
            form.setValue("coverId", v?.id ?? null, { shouldDirty: true });
          }}
        />
        <Field
          label="Isi"
          htmlFor="a-body"
          error={errors.body?.message}
          hint="HTML sederhana: <p>, <h2>, <h3>, <strong>, <em>, <ul>, <ol>, <a>, <blockquote>, <table>. Skrip dan gaya dibuang otomatis."
        >
          <Textarea rows={14} className="min-h-72" {...f("body")} {...form.register("body")} />
        </Field>
      </FormSection>
      <FormSection title="Publikasi">
        <Field label="Status" htmlFor="a-status" error={errors.status?.message} hint="Tanggal terbit diisi otomatis saat pertama kali diterbitkan.">
          <NativeSelect className="sm:max-w-56" {...f("status")} {...form.register("status")}>
            <option value="DRAF">Draf</option>
            <option value="TERBIT">Terbit</option>
            <option value="ARSIP">Arsip</option>
          </NativeSelect>
        </Field>
      </FormSection>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : defaults.id ? "Simpan artikel" : "Buat artikel"}
        </Button>
        {defaults.id && (
          <DeleteButton
            label="Hapus artikel"
            title="Hapus artikel ini?"
            description="Artikel dihapus permanen dari halaman Informasi."
            action={() => hapusArtikel({ id: defaults.id })}
            redirectTo="/admin/informasi"
            successMessage="Artikel dihapus."
          />
        )}
      </div>
    </form>
  );
}
