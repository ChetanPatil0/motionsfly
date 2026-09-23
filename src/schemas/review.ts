import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(5, "Review must be at least 5 characters").max(2000),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
