import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generateUniqueSlug } from "@/lib/slug";
import { productSchema } from "@/schemas/product";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const admin = await requireAdmin();
  const isAdminRequest = url.searchParams.get("scope") === "admin";

  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Number(url.searchParams.get("pageSize")) || 20);
  const q = url.searchParams.get("q")?.trim();
  const categoryId = url.searchParams.get("categoryId") ?? undefined;

  const sortByParam = url.searchParams.get("sortBy") ?? "createdAt";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const SORTABLE_FIELDS = new Set(["createdAt", "title", "priceINR", "isPublished"]);
  const sortBy = SORTABLE_FIELDS.has(sortByParam) ? sortByParam : "createdAt";

  // Only admins may view unpublished/deleted products — everyone else gets the public catalog.
  const where = {
    deletedAt: null,
    ...(isAdminRequest && admin ? {} : { isPublished: true }),
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: { select: { name: true, slug: true } }, _count: { select: { likes: true, reviews: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return apiSuccess({ products, items: products, total, page, pageSize }, "Products loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const slug = await generateUniqueSlug(
    parsed.data.title,
    async (candidate) => !!(await prisma.product.findUnique({ where: { slug: candidate } }))
  );

  const product = await prisma.product.create({
    data: { ...parsed.data, slug },
  });

  return apiSuccess(product, "Product created successfully.", 201);
});
