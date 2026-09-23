import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { reviewSchema } from "@/schemas/review";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) return apiError("productId is required.", [], 422);

  const reviews = await prisma.review.findMany({
    where: { productId, isHidden: false, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return apiSuccess(reviews, "Reviews loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in to write a review.", [], 401);

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const userId = (user as { id: string }).id;

  // Server-side purchase verification — never trust the client (Section 25).
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId: parsed.data.productId,
      order: { userId, status: "PAID", paymentStatus: "SUCCESS" },
    },
  });

  if (!purchased) {
    return apiError("You can only review products you have purchased.", [], 403);
  }

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId: parsed.data.productId } },
  });

  if (existing) {
    const updated = await prisma.review.update({
      where: { id: existing.id },
      data: { rating: parsed.data.rating, content: parsed.data.content, deletedAt: null },
    });
    return apiSuccess(updated, "Review updated successfully.");
  }

  const review = await prisma.review.create({
    data: { userId, productId: parsed.data.productId, rating: parsed.data.rating, content: parsed.data.content },
  });

  return apiSuccess(review, "Review submitted successfully.", 201);
});
