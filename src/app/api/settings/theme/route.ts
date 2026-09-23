import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const themeSchema = z.object({ theme: z.enum(["LIGHT", "DARK", "SYSTEM"]) });

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in.", [], 401);

  const body = await req.json();
  const parsed = themeSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid theme value.", parsed.error.issues, 422);

  await prisma.userPreference.upsert({
    where: { userId: (user as { id: string }).id },
    update: { theme: parsed.data.theme },
    create: { userId: (user as { id: string }).id, theme: parsed.data.theme },
  });

  return apiSuccess(null, "Theme preference saved.");
});
