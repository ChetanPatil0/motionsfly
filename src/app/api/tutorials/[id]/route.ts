import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { tutorialSchema } from "@/schemas/tutorial";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const tutorial = await prisma.tutorial.findUnique({ where: { id: params.id }, include: { category: true } });
  if (!tutorial) return apiError("Tutorial not found.", [], 404);
  return apiSuccess(tutorial, "Tutorial loaded.");
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = tutorialSchema.partial().safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const tutorial = await prisma.tutorial.update({ where: { id: params.id }, data: parsed.data });
  return apiSuccess(tutorial, "Tutorial updated successfully.");
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  await prisma.tutorial.update({ where: { id: params.id }, data: { deletedAt: new Date(), isPublished: false } });
  return apiSuccess(null, "Tutorial moved to trash.");
});
