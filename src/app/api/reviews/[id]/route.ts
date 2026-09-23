import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const patchSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  content: z.string().trim().min(5).max(2000).optional(),
  isHidden: z.boolean().optional(), // admin-only field
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in.", [], 401);

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return apiError("Review not found.", [], 404);

  const admin = await requireAdmin();
  const isOwner = review.userId === (user as { id: string }).id;
  if (!isOwner && !admin) return apiError("You do not have access to this review.", [], 403);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  // Only admins may toggle visibility; owners may only edit their own text/rating.
  const data: Record<string, unknown> = {};
  if (isOwner) {
    if (parsed.data.rating !== undefined) data.rating = parsed.data.rating;
    if (parsed.data.content !== undefined) data.content = parsed.data.content;
  }
  if (admin && parsed.data.isHidden !== undefined) data.isHidden = parsed.data.isHidden;

  const updated = await prisma.review.update({ where: { id: params.id }, data });
  return apiSuccess(updated, "Review updated successfully.");
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in.", [], 401);

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return apiError("Review not found.", [], 404);

  const admin = await requireAdmin();
  const isOwner = review.userId === (user as { id: string }).id;
  if (!isOwner && !admin) return apiError("You do not have access to this review.", [], 403);

  await prisma.review.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return apiSuccess(null, "Review deleted successfully.");
});
