import { z } from "zod";

import { fromJakartaInput } from "@/lib/datetime";

// Aturan field form admin yang nilainya string di browser (input HTML) dan diubah ke
// tipe aslinya oleh Zod, sama di client dan server.

/** Bilangan bulat wajib dari string input. */
export const intField = (label: string, min: number, max = 1_000_000_000) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .regex(/^-?\d+$/, `${label} harus bilangan bulat`)
    .transform(Number)
    .pipe(z.number().min(min, `${label} minimal ${min.toLocaleString("id-ID")}`).max(max, `${label} maksimal ${max.toLocaleString("id-ID")}`));

/** Bilangan bulat opsional: kosong menjadi null. */
export const optionalIntField = (label: string, min: number, max = 1_000_000_000) =>
  z
    .string()
    .trim()
    .regex(/^(-?\d+)?$/, `${label} harus bilangan bulat`)
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().min(min, `${label} minimal ${min.toLocaleString("id-ID")}`).max(max, `${label} maksimal ${max.toLocaleString("id-ID")}`).nullable());

/** Angka desimal (koma atau titik) dari string input. */
export const decimalField = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .transform((v) => v.replace(",", "."))
    .refine((v) => /^-?\d+(\.\d+)?$/.test(v), `${label} harus angka`)
    .transform(Number)
    .pipe(z.number().min(min, `${label} minimal ${String(min).replace(".", ",")}`).max(max, `${label} maksimal ${String(max).replace(".", ",")}`));

/** Waktu WIB dari input datetime-local. */
export const dateTimeField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .transform((v, ctx) => {
      const d = fromJakartaInput(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: `${label} belum valid` });
        return z.NEVER;
      }
      return d;
    });

/** Waktu WIB opsional. */
export const optionalDateTimeField = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const d = fromJakartaInput(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: `${label} belum valid` });
        return z.NEVER;
      }
      return d;
    });

/** Slug URL Bahasa Indonesia: huruf kecil, angka, tanda hubung (Q.2.5). */
export const slugField = z
  .string()
  .trim()
  .min(3, "Slug minimal 3 karakter")
  .max(120, "Slug terlalu panjang")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda hubung, mis. persiapan-utbk-snbt");

/** Ubah judul menjadi slug: "Persiapan UTBK/SNBT" → "persiapan-utbk-snbt". */
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
