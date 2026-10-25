import { z } from "zod";

import { intField, optionalDateTimeField } from "./form-rules";

export const bannerSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(3, "Judul minimal 3 karakter").max(120, "Judul terlalu panjang"),
    imageId: z.string().min(1, "Unggah gambar banner"),
    href: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^\/[^\s]*$/.test(v) || /^https:\/\/\S+$/.test(v), "Tautan diawali / (halaman Taman Pelajar) atau https://"),
    order: intField("Urutan", 0, 999),
    isActive: z.boolean(),
    startsAt: optionalDateTimeField("Mulai tayang"),
    endsAt: optionalDateTimeField("Selesai tayang"),
  })
  .superRefine((v, ctx) => {
    if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Selesai tayang harus setelah mulai tayang" });
  });
export type BannerInput = z.input<typeof bannerSchema>;
