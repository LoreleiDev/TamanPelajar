import { z } from "zod";

import { lengkapiProfilSchema, passwordRule } from "@/features/auth/schemas";

export const profilSchema = lengkapiProfilSchema.extend({
  name: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(80, "Nama terlalu panjang"),
});

export const gantiPasswordSchema = z
  .object({
    currentPassword: z.string().max(72).optional(),
    password: passwordRule,
    confirmPassword: z.string().min(1, "Ulangi password"),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Konfirmasi password tidak sama" });

export type ProfilInput = z.input<typeof profilSchema>;
export type GantiPasswordInput = z.input<typeof gantiPasswordSchema>;
