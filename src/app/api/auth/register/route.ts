import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/schemas/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendOtpEmail } from "@/lib/email";
import crypto from "crypto";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export const POST = withErrorHandling(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return apiError("Too many accounts created recently. Please try again later.", [], 429);
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid input.", parsed.error.issues, 422);
  }

  const { name, email, country, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return apiError("An account with this email already exists.", [], 409);
  }

  const passwordHash = await hashPassword(password);
  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

  // Nothing is written to the real users table yet — the account only
  // becomes real once the OTP is verified (see /api/auth/verify-otp).
  await prisma.pendingRegistration.upsert({
    where: { email },
    update: { name, country, passwordHash, otpCode, otpExpiresAt },
    create: { name, email, country, passwordHash, otpCode, otpExpiresAt },
  });

  await sendOtpEmail({ to: email, code: otpCode });

  return apiSuccess({ email }, "Check your email for a verification code to finish creating your account.", 201);
});
