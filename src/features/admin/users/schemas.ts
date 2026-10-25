import { z } from "zod";

import { emailRule, passwordRule } from "@/features/auth/schemas";

const name = z.string().trim().min(3, "Nama minimal 3 karakter").max(80, "Nama terlalu panjang");
const role = z.enum(["ADMIN", "USER"], { error: "Pilih role" });

export const userCreateSchema = z.object({ name, email: emailRule, role, password: passwordRule });

export const userUpdateSchema = z.object({ id: z.string().min(1), name, email: emailRule, role });

export const userStatusSchema = z.object({ id: z.string().min(1), active: z.boolean() });

export const userIdSchema = z.object({ id: z.string().min(1) });

export type UserCreateInput = z.input<typeof userCreateSchema>;
export type UserUpdateInput = z.input<typeof userUpdateSchema>;

/** Filter daftar pengguna dari parameter URL; nilai tak dikenal diabaikan. */
export const userFilterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  role: z.enum(["ADMIN", "USER"]).optional().catch(undefined),
  status: z.enum(["aktif", "nonaktif"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export type UserFilter = z.output<typeof userFilterSchema>;
