import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(30),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().int().min(1),
  minOrderAmount: z.coerce.number().int().min(0).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(true),
});
export type CouponInput = z.infer<typeof couponSchema>;

export const applyCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(1),
});
