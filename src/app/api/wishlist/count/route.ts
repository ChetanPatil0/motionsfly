import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  if (!user) return apiSuccess({ count: 0 }, "Not logged in.");

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: (user as { id: string }).id },
    include: { _count: { select: { items: true } } },
  });

  return apiSuccess({ count: wishlist?._count.items ?? 0 }, "Wishlist count loaded.");
});
