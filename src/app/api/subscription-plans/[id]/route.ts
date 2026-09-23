import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { subscriptionPlanSchema } from "@/schemas/subscription-plan";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = subscriptionPlanSchema.partial().safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const plan = await prisma.subscriptionPlan.update({ where: { id: params.id }, data: parsed.data });
  return apiSuccess(plan, "Plan updated successfully.");
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  // Plans with existing subscriptions are deactivated rather than deleted,
  // to preserve subscription history (Section 15 requires retaining it).
  const activeCount = await prisma.subscription.count({ where: { planId: params.id } });
  if (activeCount > 0) {
    await prisma.subscriptionPlan.update({ where: { id: params.id }, data: { isActive: false } });
    return apiSuccess(null, "Plan has existing subscribers — deactivated instead of deleted to preserve history.");
  }

  await prisma.subscriptionPlan.delete({ where: { id: params.id } });
  return apiSuccess(null, "Plan deleted successfully.");
});
