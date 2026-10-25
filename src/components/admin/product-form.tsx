"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";

import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection } from "@/components/admin/form-fields";
import { MediaUploader, type MediaValue } from "@/components/admin/media-uploader";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EDUCATION_OPTIONS } from "@/features/auth/schemas";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { shouldAutoSlug, slugify } from "@/features/admin/form-rules";
import { hapusProduk, simpanProduk } from "@/features/admin/products/actions";
import { PROGRAM_TYPES, productSchema, programTypeLabel, type ProductInput } from "@/features/admin/products/schemas";

type Option = { id: string; label: string; hint: string };
type ListName = "courseIds" | "examIds" | "videoIds";

/** Daftar centang isi paket; nilai disimpan sebagai array ID di form. */
function ContentChecklist({
  name,
  legend,
  options,
  control,
  setValue,
  empty,
}: {
  name: ListName;
  legend: string;
  options: Option[];
  control: Control<ProductInput>;
  setValue: UseFormSetValue<ProductInput>;
  empty: string;
}) {
  const selected = useWatch({ control, name }) ?? [];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-semibold">
        {legend} <span className="font-normal text-muted-foreground tabular-nums">({selected.length} dipilih)</span>
      </legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
          {options.map((o) => (
            <li key={o.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-secondary">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  checked={selected.includes(o.id)}
                  onChange={(e) =>
                    setValue(name, e.target.checked ? [...selected, o.id] : selected.filter((id) => id !== o.id), { shouldDirty: true, shouldValidate: false })
                  }
                />
                <span className="min-w-0">
                  <span className="block">{o.label}</span>
                  <span className="block text-sm text-muted-foreground">{o.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

/** Form paket produk (M.4). */
export function ProductForm({
  defaults,
  categories,
  options,
  thumbnail,
}: {
  defaults: ProductInput;
  categories: { id: string; name: string }[];
  options: { courses: Option[]; exams: Option[]; videos: Option[] };
  thumbnail: MediaValue | null;
}) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaValue | null>(thumbnail);
  const form = useForm<ProductInput>({ resolver: zodResolver(productSchema) as never, defaultValues: defaults });
  const { errors } = form.formState;
  const faq = useFieldArray({ control: form.control, name: "faq" });
  const f = (name: keyof ProductInput) => ({ id: `pr-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`pr-${name}`, errors[name]?.message as string | undefined) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: ProductInput) => simpanProduk(v), (data) => {
    toast.success(defaults.id ? "Paket disimpan." : "Paket dibuat.");
    if (defaults.id) router.refresh();
    else router.push(`/admin/produk/${data.id}`);
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <FormAlert message={error} />
      <FormSection title="Identitas">
        <Field label="Nama paket" htmlFor="pr-name" error={errors.name?.message}>
          <Input autoComplete="off" {...f("name")} {...form.register("name", { onBlur: (e) => shouldAutoSlug(form.getValues("slug"), e) && form.setValue("slug", slugify(e.target.value)) })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug URL" htmlFor="pr-slug" error={errors.slug?.message} hint="Alamat: /paket/slug-ini">
            <Input autoComplete="off" {...f("slug")} {...form.register("slug")} />
          </Field>
          <Field label="Program" htmlFor="pr-categoryId" error={errors.categoryId?.message}>
            <NativeSelect {...f("categoryId")} {...form.register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Jenis program" htmlFor="pr-programType" error={errors.programType?.message}>
            <NativeSelect {...f("programType")} {...form.register("programType")}>
              {PROGRAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {programTypeLabel[t]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Jenjang" htmlFor="pr-educationLevel" error={errors.educationLevel?.message}>
            <NativeSelect {...f("educationLevel")} {...form.register("educationLevel")}>
              {EDUCATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field label="Ringkasan" htmlFor="pr-summary" error={errors.summary?.message} hint="Tampil di kartu paket.">
          <Textarea rows={2} {...f("summary")} {...form.register("summary")} />
        </Field>
        <Field label="Deskripsi" htmlFor="pr-description" error={errors.description?.message} hint="Pisahkan paragraf dengan baris kosong.">
          <Textarea rows={6} {...f("description")} {...form.register("description")} />
        </Field>
        <MediaUploader
          label="Thumbnail (opsional)"
          folder="produk"
          kind="image"
          value={media}
          hint="Tanpa thumbnail, sampul dibuat otomatis dari warna program."
          onChange={(v) => {
            setMedia(v);
            form.setValue("thumbnailId", v?.id ?? null, { shouldDirty: true });
          }}
        />
      </FormSection>

      <FormSection title="Harga dan masa aktif">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Harga normal (Rp)" htmlFor="pr-price" error={errors.price?.message}>
            <Input inputMode="numeric" {...f("price")} {...form.register("price")} />
          </Field>
          <Field label="Harga promo (Rp)" htmlFor="pr-promoPrice" error={errors.promoPrice?.message} hint="Kosongkan bila tidak promo.">
            <Input inputMode="numeric" {...f("promoPrice")} {...form.register("promoPrice")} />
          </Field>
          <Field label="Masa aktif (hari)" htmlFor="pr-activeDays" error={errors.activeDays?.message}>
            <Input inputMode="numeric" {...f("activeDays")} {...form.register("activeDays")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Isi paket" description="Siswa yang membeli paket mendapat akses ke semua yang dicentang selama masa aktif.">
        <ContentChecklist name="courseIds" legend="Kelas" options={options.courses} control={form.control} setValue={form.setValue} empty="Belum ada kelas." />
        <ContentChecklist name="examIds" legend="Tryout" options={options.exams} control={form.control} setValue={form.setValue} empty="Belum ada tryout." />
        <ContentChecklist
          name="videoIds"
          legend="Video lepas"
          options={options.videos}
          control={form.control}
          setValue={form.setValue}
          empty="Semua video sudah menjadi bagian kelas; video kelas ikut terbuka lewat kelasnya."
        />
      </FormSection>

      <FormSection title="Fitur dan FAQ">
        <Field label="Fitur paket" htmlFor="pr-features" error={errors.features?.message as string | undefined} hint="Satu fitur per baris, maksimal 12.">
          <Textarea rows={5} {...f("features")} {...form.register("features")} />
        </Field>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-semibold">Pertanyaan umum</legend>
          {faq.fields.map((field, i) => (
            <div key={field.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-2">
                <label htmlFor={`faq-q-${i}`} className="sr-only">
                  Pertanyaan {i + 1}
                </label>
                <Input id={`faq-q-${i}`} placeholder={`Pertanyaan ${i + 1}`} {...form.register(`faq.${i}.question`)} />
                <label htmlFor={`faq-a-${i}`} className="sr-only">
                  Jawaban {i + 1}
                </label>
                <Textarea id={`faq-a-${i}`} rows={2} placeholder="Jawaban" {...form.register(`faq.${i}.answer`)} />
              </div>
              <Button type="button" size="icon" variant="ghost" aria-label={`Hapus pertanyaan ${i + 1}`} onClick={() => faq.remove(i)} className="text-muted-foreground hover:text-destructive">
                <X />
              </Button>
            </div>
          ))}
          {errors.faq && (
            <p role="alert" className="text-sm text-destructive">
              {errors.faq.message ?? errors.faq.root?.message}
            </p>
          )}
          {faq.fields.length < 10 && (
            <Button type="button" variant="outline" className="self-start" onClick={() => faq.append({ question: "", answer: "" })}>
              <Plus data-icon="inline-start" />
              Tambah pertanyaan
            </Button>
          )}
        </fieldset>
      </FormSection>

      <FormSection title="Publikasi">
        <Field label="Status" htmlFor="pr-status" error={errors.status?.message} hint="Hanya paket terbit yang tampil di katalog dan bisa dibeli.">
          <NativeSelect className="sm:max-w-56" {...f("status")} {...form.register("status")}>
            <option value="DRAF">Draf</option>
            <option value="TERBIT">Terbit</option>
            <option value="ARSIP">Arsip</option>
          </NativeSelect>
        </Field>
      </FormSection>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : defaults.id ? "Simpan paket" : "Buat paket"}
        </Button>
        {defaults.id && (
          <DeleteButton
            label="Hapus paket"
            title="Hapus paket ini?"
            description="Paket hilang dari katalog dan keranjang. Siswa yang sudah membeli tetap punya akses sampai masa aktifnya habis."
            action={() => hapusProduk({ id: defaults.id })}
            redirectTo="/admin/produk"
            successMessage="Paket dihapus."
          />
        )}
      </div>
    </form>
  );
}
