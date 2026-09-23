import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { deletePublicImage } from "@/lib/public-storage";
import { parseSlideSubtitle } from "@/lib/slide-helper";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  subtitle: z.string().trim().max(20000).optional(),
  imageUrl: z.string().trim().nullable().optional(),
  ctaLabel: z.string().trim().max(50).optional(),
  ctaHref: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const existing = await prisma.heroSlide.findUnique({ where: { id: params.id } });
  if (existing) {
    // If imageUrl was updated and different, clean up old file from disk
    if (parsed.data.imageUrl !== undefined && existing.imageUrl && parsed.data.imageUrl !== existing.imageUrl) {
      await deletePublicImage(existing.imageUrl);
    }
  }

  const slide = await prisma.heroSlide.update({ where: { id: params.id }, data: parsed.data });
  return apiSuccess(slide, "Hero slide updated successfully.");
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } });
  if (slide) {
    // Clean up uploaded image from disk
    if (slide.imageUrl) {
      await deletePublicImage(slide.imageUrl);
    }
    // Delete record permanently from database
    await prisma.heroSlide.delete({ where: { id: params.id } });
  }

  return apiSuccess(null, "Hero slide deleted successfully.");
});
