import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { couponSchema } from "@/schemas/coupon";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = couponSchema.partial().safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const coupon = await prisma.coupon.update({ where: { id: params.id }, data: parsed.data });
  return apiSuccess(coupon, "Coupon updated successfully.");
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  await prisma.coupon.delete({ where: { id: params.id } });
  return apiSuccess(null, "Coupon deleted successfully.");
});
