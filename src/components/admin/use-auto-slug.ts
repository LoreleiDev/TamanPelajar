"use client";

import { useEffect, useRef } from "react";
import { useWatch, type FieldValues, type Path, type PathValue, type UseFormReturn } from "react-hook-form";

import { slugify } from "@/features/admin/form-rules";

/**
 * Slug otomatis (revisi RMED): saat membuat data baru, slug mengikuti judul/nama setiap kali
 * diketik. Begitu admin mengubah slug sendiri, slug tidak lagi diubah (kembali otomatis bila
 * slug dikosongkan). Pada form ubah slug dibiarkan agar URL yang sudah terbit tidak berubah.
 * Kembalikan props untuk input slug.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- konteks dan nilai hasil transformasi tidak dipakai
export function useAutoSlug<T extends FieldValues>(form: UseFormReturn<T, any, any>, source: Path<T>, enabled: boolean) {
  const title = useWatch({ control: form.control, name: source }) as unknown;
  const manual = useRef(!enabled);

  useEffect(() => {
    if (manual.current) return;
    const slug = slugify(typeof title === "string" ? title : "");
    form.setValue("slug" as Path<T>, slug as PathValue<T, Path<T>>, { shouldValidate: form.formState.isSubmitted });
  }, [title, form]);

  return {
    onInput: (e: { currentTarget: HTMLInputElement }) => {
      manual.current = e.currentTarget.value.trim() !== "";
    },
  };
}
