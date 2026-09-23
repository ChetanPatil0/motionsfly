import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { couponSchema } from "@/schemas/coupon";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = 20;
  const q = url.searchParams.get("q")?.trim();

  const where = q ? { code: { contains: q, mode: "insensitive" as const } } : {};

  const [items, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { usages: true } } },
    }),
    prisma.coupon.count({ where }),
  ]);

  return apiSuccess({ items, coupons: items, total, page, pageSize }, "Coupons loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) return apiError("A coupon with this code already exists.", [], 409);

  const coupon = await prisma.coupon.create({ data: parsed.data });
  return apiSuccess(coupon, "Coupon created successfully.", 201);
});
