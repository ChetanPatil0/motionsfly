import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const wishlistSchema = z.object({ productId: z.string().uuid() });

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in to use your wishlist.", [], 401);

  const body = await req.json();
  const parsed = wishlistSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const wishlist = await prisma.wishlist.upsert({
    where: { userId: (user as { id: string }).id },
    update: {},
    create: { userId: (user as { id: string }).id },
  });

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId: parsed.data.productId } },
  });

  if (existing) {
    return apiSuccess({ inWishlist: true }, "Already in your wishlist.");
  }

  await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId: parsed.data.productId } });
  return apiSuccess({ inWishlist: true }, "Product added to wishlist.");
});

export const DELETE = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in to use your wishlist.", [], 401);

  const body = await req.json();
  const parsed = wishlistSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const wishlist = await prisma.wishlist.findUnique({ where: { userId: (user as { id: string }).id } });
  if (wishlist) {
    await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId: parsed.data.productId } });
  }

  return apiSuccess({ inWishlist: false }, "Product removed from wishlist.");
});
