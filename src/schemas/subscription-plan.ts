import { z } from "zod";

export const subscriptionPlanSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  priceINR: z.coerce.number().int().min(0),
  priceUSD: z.coerce.number().int().min(0),
  billingInterval: z.enum(["MONTHLY", "YEARLY"]),
  isActive: z.boolean().default(true),
});
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
