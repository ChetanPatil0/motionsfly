import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().length(6),
});

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  if (!checkRateLimit(`verify-otp:${parsed.data.email}`, 8, 15 * 60 * 1000)) {
    return apiError("Too many attempts. Please request a new code.", [], 429);
  }

  const pending = await prisma.pendingRegistration.findUnique({ where: { email: parsed.data.email } });
  if (!pending) return apiError("Invalid verification code.", [], 400);

  if (pending.otpExpiresAt < new Date()) {
    return apiError("This code has expired. Please request a new one.", [], 400);
  }

  if (pending.otpCode !== parsed.data.code) {
    return apiError("Invalid verification code.", [], 400);
  }

  // Verification succeeded — this is the moment the account becomes real.
  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: pending.email } });
    if (!existing) {
      await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          passwordHash: pending.passwordHash,
          country: pending.country,
          emailVerified: new Date(),
          preference: { create: { theme: "SYSTEM" } },
          cart: { create: {} },
          wishlist: { create: {} },
        },
      });
    }
    await tx.pendingRegistration.delete({ where: { email: pending.email } });
  });

  return apiSuccess(null, "Email verified successfully. You can now log in.");
});
