import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const SORTABLE_FIELDS = new Set(["createdAt", "name", "email"]);

export const GET = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = 20;
  const q = url.searchParams.get("q")?.trim();
  const sortByParam = url.searchParams.get("sortBy") ?? "createdAt";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const sortBy = SORTABLE_FIELDS.has(sortByParam) ? sortByParam : "createdAt";

  const where = {
    role: "CUSTOMER" as const,
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true, subscriptions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return apiSuccess({ items, total, page, pageSize }, "Users loaded.");
});
