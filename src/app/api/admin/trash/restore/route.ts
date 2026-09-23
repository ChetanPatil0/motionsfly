import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const schema = z.object({ type: z.enum(["PRODUCT", "TUTORIAL"]), id: z.string().uuid() });

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  if (parsed.data.type === "PRODUCT") {
    await prisma.product.update({ where: { id: parsed.data.id }, data: { deletedAt: null } });
  } else {
    await prisma.tutorial.update({ where: { id: parsed.data.id }, data: { deletedAt: null } });
  }

  return apiSuccess(null, "Restored successfully. It remains unpublished until you re-enable it.");
});
