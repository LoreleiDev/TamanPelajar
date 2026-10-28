"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckField } from "@/components/admin/form-fields";
import { MediaUploader, type MediaValue } from "@/components/admin/media-uploader";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { bannerSchema, type BannerInput } from "@/features/admin/banner-schema";
import { simpanBanner } from "@/features/admin/site-actions";

/** Tambah/ubah banner beranda (C.2.8). */
export function BannerDialog({ trigger, defaults, image }: { trigger: ReactNode; defaults: BannerInput; image: MediaValue | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<MediaValue | null>(image);
  const form = useForm({ resolver: zodResolver(bannerSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const f = (name: keyof BannerInput) => ({ id: `b-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`b-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: BannerInput) => simpanBanner(v), () => {
    toast.success(defaults.id ? "Banner disimpan." : "Banner ditambahkan.");
    setOpen(false);
    if (!defaults.id) {
      form.reset(defaults);
      setMedia(null);
    }
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">{defaults.id ? "Ubah banner" : "Tambah banner"}</DialogTitle>
          <DialogDescription>Banner aktif tampil di beranda di bawah menu cepat, berurutan sesuai nomor urut.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />
          <Field label="Judul" htmlFor="b-title" error={errors.title?.message} hint="Dipakai sebagai teks alternatif gambar.">
            <Input autoComplete="off" {...f("title")} {...form.register("title")} />
          </Field>
          {/* Panduan ukuran: banner tampil berasio 3:1 di beranda (banner-strip.tsx). */}
          <div className="flex items-center gap-4 rounded-lg bg-secondary p-3 text-sm">
            <div aria-hidden="true" className="grid aspect-[3/1] w-24 shrink-0 place-items-center rounded-md border-2 border-dashed border-primary text-[0.6875rem] font-bold text-primary tabular-nums">
              3 : 1
            </div>
            <p>
              <span className="font-semibold">Ukuran ideal 1200 × 400 piksel</span> (lebar × tinggi, rasio 3:1). Gambar dengan ukuran
              lain dipotong otomatis dari tengah, jadi letakkan teks penting di tengah gambar.
            </p>
          </div>
          {media?.url && (
            <figure className="flex flex-col gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau URL Cloudinary dinamis */}
              <img src={media.url} alt="" className="aspect-[3/1] w-full rounded-xl object-cover" />
              <figcaption className="text-sm text-muted-foreground">Pratinjau seperti tampil di beranda.</figcaption>
            </figure>
          )}
          <MediaUploader
            label="Gambar banner"
            folder="banner"
            kind="image"
            value={media}
            hint="Ukuran ideal 1200 × 400 px (rasio 3:1)."
            onChange={(v) => {
              setMedia(v);
              form.setValue("imageId", v?.id ?? "", { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
            }}
          />
          {errors.imageId && (
            <p role="alert" className="-mt-2 text-sm text-destructive">
              {errors.imageId.message}
            </p>
          )}
          <Field label="Tautan (opsional)" htmlFor="b-href" error={errors.href?.message} hint="Mis. /paket/persiapan-utbk-snbt atau https://…">
            <Input autoComplete="off" {...f("href")} {...form.register("href")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mulai tayang (WIB, opsional)" htmlFor="b-startsAt" error={errors.startsAt?.message}>
              <Input type="datetime-local" {...f("startsAt")} {...form.register("startsAt")} />
            </Field>
            <Field label="Selesai tayang (WIB, opsional)" htmlFor="b-endsAt" error={errors.endsAt?.message}>
              <Input type="datetime-local" {...f("endsAt")} {...form.register("endsAt")} />
            </Field>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-28">
              <Field label="Urutan" htmlFor="b-order" error={errors.order?.message}>
                <Input inputMode="numeric" {...f("order")} {...form.register("order")} />
              </Field>
            </div>
            <CheckField id="b-isActive" label="Aktif" className="pb-2" {...form.register("isActive")} />
          </div>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Menyimpan…" : "Simpan banner"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
