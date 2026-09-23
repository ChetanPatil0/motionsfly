import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

import crypto from "crypto";
const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  country: z.string().trim().length(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in.", [], 401);

  const profile = await prisma.user.findUnique({
    where: { id: (user as { id: string }).id },
    select: { id: true, name: true, email: true, country: true, pendingEmail: true, loyaltyPoints: true, createdAt: true },
  });

  return apiSuccess(profile, "Profile loaded.");
});

export const PATCH = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in.", [], 401);

  const userId = (user as { id: string }).id;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const { name, country, email } = parsed.data;
  const immediateUpdate: Record<string, unknown> = {};
  if (name) immediateUpdate.name = name;
  if (country) immediateUpdate.country = country;

  if (Object.keys(immediateUpdate).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: immediateUpdate });
  }

  // Email changes are never applied immediately — they're staged and only
  // take effect once the new address is verified with an OTP.
  if (email) {
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (current?.email === email) {
      return apiSuccess(null, "That's already your current email.");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError("That email is already in use.", [], 409);

    if (!checkRateLimit(`email-change:${userId}`, 3, 60 * 60 * 1000)) {
      return apiError("Too many attempts. Please try again later.", [], 429);
    }

    const otpCode = generateOtp();
    await prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: email, otpCode, otpExpiresAt: new Date(Date.now() + 1000 * 60 * 15) },
    });
    await sendOtpEmail({ to: email, code: otpCode });

    return apiSuccess(null, "Verification code sent to your new email address.");
  }

  return apiSuccess(null, "Profile updated successfully.");
});
