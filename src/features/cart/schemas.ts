import { z } from "zod";

export const addToCartSchema = z.object({ slug: z.string().min(1).max(191) });
export const removeFromCartSchema = z.object({ productId: z.string().min(1).max(40) });
