import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendOtpEmail } from "@/lib/email";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  if (!checkRateLimit(`resend-otp:${parsed.data.email}`, 3, 15 * 60 * 1000)) {
    return apiError("Please wait a few minutes before requesting another code.", [], 429);
  }

  const pending = await prisma.pendingRegistration.findUnique({ where: { email: parsed.data.email } });
  if (pending) {
    const otpCode = generateOtp();
    await prisma.pendingRegistration.update({
      where: { email: pending.email },
      data: { otpCode, otpExpiresAt: new Date(Date.now() + 1000 * 60 * 15) },
    });
    await sendOtpEmail({ to: pending.email, code: otpCode });
  }

  return apiSuccess(null, "If a pending registration exists for this email, a new code has been sent.");
});
