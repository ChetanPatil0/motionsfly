import { z } from "zod";

export const addCartItemSchema = z.object({
  type: z.enum(["PRODUCT", "TUTORIAL", "SUBSCRIPTION_PLAN"]),
  productId: z.string().min(1).optional(),
  tutorialId: z.string().min(1).optional(),
  planId: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

