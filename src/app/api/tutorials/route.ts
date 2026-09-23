import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generateUniqueSlug } from "@/lib/slug";
import { tutorialSchema } from "@/schemas/tutorial";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const admin = await requireAdmin();
  const isAdminRequest = url.searchParams.get("scope") === "admin";

  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Number(url.searchParams.get("pageSize")) || 20);
  const q = url.searchParams.get("q")?.trim();

  const sortByParam = url.searchParams.get("sortBy") ?? "createdAt";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const SORTABLE_FIELDS = new Set(["createdAt", "title", "isPublished", "accessType"]);
  const sortBy = SORTABLE_FIELDS.has(sortByParam) ? sortByParam : "createdAt";

  const where = {
    deletedAt: null,
    ...(isAdminRequest && admin ? {} : { isPublished: true }),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [tutorials, total] = await Promise.all([
    prisma.tutorial.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.tutorial.count({ where }),
  ]);

  return apiSuccess({ tutorials, items: tutorials, total, page, pageSize }, "Tutorials loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = tutorialSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const slug = await generateUniqueSlug(
    parsed.data.title,
    async (candidate) => !!(await prisma.tutorial.findUnique({ where: { slug: candidate } }))
  );

  const tutorial = await prisma.tutorial.create({ data: { ...parsed.data, slug } });
  return apiSuccess(tutorial, "Tutorial created successfully.", 201);
});
