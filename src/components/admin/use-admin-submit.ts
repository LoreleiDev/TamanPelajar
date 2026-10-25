"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import type { ActionResult } from "@/lib/action-result";

/**
 * Kirim form admin ke server action: pesan umum di atas form, pesan per field di bawah
 * input, lalu onSuccess bila berhasil. Yang dikirim adalah nilai mentah form (string dari
 * input), bukan hasil transformasi Zod, karena server memvalidasi ulang dengan skema yang sama.
 */
export function useAdminSubmit<T extends FieldValues, R>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- konteks dan nilai hasil transformasi tidak dipakai
  form: UseFormReturn<T, any, any>,
  action: (values: T) => Promise<ActionResult<R>>,
  onSuccess: (data: R) => void,
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      setError(undefined);
      const r = await action(form.getValues());
      if (!r.ok) {
        setError(r.error);
        for (const [k, m] of Object.entries(r.fieldErrors ?? {})) form.setError(k as Path<T>, { message: m });
        return;
      }
      onSuccess(r.data);
    }),
  );
  return { pending, error, onSubmit };
}
