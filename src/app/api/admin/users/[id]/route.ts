import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const patchSchema = z.object({ isActive: z.boolean().optional(), name: z.string().trim().min(2).max(100).optional() });

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const user = await prisma.user.update({ where: { id: params.id }, data: parsed.data });
  return apiSuccess(user, `User ${parsed.data.isActive === false ? "disabled" : "updated"} successfully.`);
});
