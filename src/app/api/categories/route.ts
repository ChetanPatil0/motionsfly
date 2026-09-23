import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generateUniqueSlug } from "@/lib/slug";
import { categorySchema } from "@/schemas/product";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async () => {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
  return apiSuccess(categories, "Categories loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const slug = await generateUniqueSlug(
    parsed.data.name,
    async (candidate) => !!(await prisma.category.findUnique({ where: { slug: candidate } }))
  );

  const category = await prisma.category.create({
    data: { ...parsed.data, slug },
  });

  return apiSuccess(category, "Category created successfully.", 201);
});
