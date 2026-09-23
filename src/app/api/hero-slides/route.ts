import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const MAX_SLIDES = 5;

const slideSchema = z.object({
  title: z.string().trim().min(1).max(150),
  subtitle: z.string().trim().max(20000).optional(),
  imageUrl: z.string().trim().optional(),
  ctaLabel: z.string().trim().max(50).optional(),
  ctaHref: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const admin = await requireAdmin();
  const isAdminRequest = url.searchParams.get("scope") === "admin";

  const slides = await prisma.heroSlide.findMany({
    where: isAdminRequest && admin ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return apiSuccess(slides, "Hero slides loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const count = await prisma.heroSlide.count();
  if (count >= MAX_SLIDES) {
    return apiError(`You can have at most ${MAX_SLIDES} hero slides. Delete one first.`, [], 422);
  }

  const body = await req.json();
  const parsed = slideSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const slide = await prisma.heroSlide.create({ data: parsed.data });
  return apiSuccess(slide, "Hero slide created successfully.", 201);
});
