import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const SORTABLE_FIELDS = new Set(["issuedAt", "invoiceNumber", "total"]);

export const GET = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = 20;
  const q = url.searchParams.get("q")?.trim();
  const sortByParam = url.searchParams.get("sortBy") ?? "issuedAt";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const sortBy = SORTABLE_FIELDS.has(sortByParam) ? sortByParam : "issuedAt";

  const where = q
    ? {
        OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" as const } },
          { billingName: { contains: q, mode: "insensitive" as const } },
          { order: { orderNumber: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  return apiSuccess({ items, total, page, pageSize }, "Invoices loaded.");
});
