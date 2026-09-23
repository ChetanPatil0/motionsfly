import { z } from "zod";

export const offerSchema = z.object({
  name: z.string().trim().min(2).max(150),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().int().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string().uuid()).min(1, "Select at least one product"),
});
export type OfferInput = z.infer<typeof offerSchema>;
