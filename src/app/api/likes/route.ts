import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const likeSchema = z.object({ productId: z.string().uuid() });

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in to like products.", [], 401);

  const body = await req.json();
  const parsed = likeSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const userId = (user as { id: string }).id;

  const existing = await prisma.productLike.findUnique({
    where: { userId_productId: { userId, productId: parsed.data.productId } },
  });

  if (existing) {
    await prisma.productLike.delete({ where: { id: existing.id } });
  } else {
    // Unique constraint on (userId, productId) makes double-liking impossible
    // even under a race — a second concurrent request simply fails to
    // insert and can be treated as a no-op.
    await prisma.productLike.create({ data: { userId, productId: parsed.data.productId } }).catch(() => null);
  }

  const count = await prisma.productLike.count({ where: { productId: parsed.data.productId } });
  return apiSuccess({ liked: !existing, count }, existing ? "Removed like." : "Product liked.");
});

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) return apiError("productId is required.", [], 422);

  const user = await requireUser();
  const userId = user ? (user as { id: string }).id : null;

  const [count, liked] = await Promise.all([
    prisma.productLike.count({ where: { productId } }),
    userId
      ? prisma.productLike.findUnique({ where: { userId_productId: { userId, productId } } }).then((r) => !!r)
      : Promise.resolve(false),
  ]);

  return apiSuccess({ count, liked }, "Like status loaded.");
});
