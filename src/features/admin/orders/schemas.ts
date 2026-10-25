import { z } from "zod";

export const ORDER_STATUSES = ["MENUNGGU", "BERHASIL", "GAGAL", "KEDALUWARSA", "DIKEMBALIKAN"] as const;

export const orderFilterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
export type OrderFilter = z.output<typeof orderFilterSchema>;

export const orderActionSchema = z.object({
  number: z.string().trim().min(1),
  action: z.enum(["verifikasi", "batalkan", "kembalikan"]),
});
