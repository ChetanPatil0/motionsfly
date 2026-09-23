import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async () => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const reviews = await prisma.review.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, product: { select: { title: true } } },
    take: 100,
  });

  return apiSuccess(reviews, "Reviews loaded.");
});
