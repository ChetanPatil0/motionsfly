import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { offerSchema } from "@/schemas/offer";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = 20;
  const q = url.searchParams.get("q")?.trim();

  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};

  const [items, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { products: { include: { product: { select: { title: true } } } } },
    }),
    prisma.offer.count({ where }),
  ]);

  return apiSuccess({ items, offers: items, total, page, pageSize }, "Offers loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const { productIds, ...offerData } = parsed.data;

  const offer = await prisma.offer.create({
    data: {
      ...offerData,
      products: { create: productIds.map((productId) => ({ productId })) },
    },
  });

  return apiSuccess(offer, "Offer created successfully.", 201);
});
