import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const pending = await prisma.pendingRegistration.findUnique({ where: { email: parsed.data.email } });
  return apiSuccess({ pending: !!pending }, "Checked.");
});
