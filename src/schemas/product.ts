import { z } from "zod";

export const PRODUCT_TYPES = [
  "DIGITAL_RESOURCE",
  "PLUGIN",
  "SCRIPT",
  "TEMPLATE",
  "PRESET",
  "LUT",
  "GRAPHICS",
  "PROJECT_FILE",
  "OTHER",
] as const;

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().trim().max(200).optional(),
  type: z.enum(PRODUCT_TYPES),
  categoryId: z.string().uuid().optional().nullable(),
  priceINR: z.coerce.number().int().min(0, "Price cannot be negative"),
  priceUSD: z.coerce.number().int().min(0, "Price cannot be negative"),
  isFree: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});
export type ProductInput = z.infer<typeof productSchema>;
