import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { subscriptionPlanSchema } from "@/schemas/subscription-plan";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  const admin = await requireAdmin();

  const plans = await prisma.subscriptionPlan.findMany({
    where: scope === "admin" && admin ? {} : { isActive: true },
    orderBy: { priceINR: "asc" },
  });

  return apiSuccess(plans, "Plans loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = subscriptionPlanSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const plan = await prisma.subscriptionPlan.create({ data: parsed.data });
  return apiSuccess(plan, "Plan created successfully.", 201);
});
