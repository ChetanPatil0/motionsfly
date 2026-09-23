import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const schema = z.object({ code: z.string().trim().length(6) });

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in.", [], 401);

  const userId = (user as { id: string }).id;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  if (!checkRateLimit(`verify-email-change:${userId}`, 8, 15 * 60 * 1000)) {
    return apiError("Too many attempts. Please request a new code.", [], 429);
  }

  const current = await prisma.user.findUnique({ where: { id: userId } });
  if (!current?.pendingEmail) {
    return apiError("No pending email change found.", [], 400);
  }
  if (!current.otpCode || !current.otpExpiresAt || current.otpExpiresAt < new Date()) {
    return apiError("This code has expired. Please request a new one.", [], 400);
  }
  if (current.otpCode !== parsed.data.code) {
    return apiError("Invalid verification code.", [], 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email: current.pendingEmail, pendingEmail: null, otpCode: null, otpExpiresAt: null },
  });

  return apiSuccess(null, "Email updated successfully.");
});
