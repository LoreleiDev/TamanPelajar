import type { z } from "zod";

// Bentuk hasil setiap Server Action (CLAUDE.md "Konvensi kode").
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; code?: string };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export const fail = (error: string, fieldErrors?: Record<string, string>): ActionResult<never> => ({
  ok: false,
  error,
  fieldErrors,
});

/** Pesan pertama per field dari ZodError, untuk ditampilkan di bawah input. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.join(".")] ??= issue.message;
  return out;
}

export const invalidInput = (error: z.ZodError) =>
  fail("Periksa kembali isian yang ditandai.", zodFieldErrors(error));
