import { z } from "zod";

export const tutorialSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10),
  contentUrl: z.string().trim().url().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().nullable(),
  accessType: z.enum(["FREE", "PAID", "PREMIUM"]),
  priceINR: z.coerce.number().int().min(0),
  priceUSD: z.coerce.number().int().min(0),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});
export type TutorialInput = z.infer<typeof tutorialSchema>;
