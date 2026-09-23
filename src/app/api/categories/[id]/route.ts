import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { categorySchema } from "@/schemas/product";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const category = await prisma.category.update({ where: { id: params.id }, data: parsed.data });
  return apiSuccess(category, "Category updated successfully.");
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  await prisma.category.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return apiSuccess(null, "Category deleted successfully.");
});
