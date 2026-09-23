import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/schemas/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid input.", parsed.error.issues, 422);
  }

  const { email } = parsed.data;

  if (!checkRateLimit(`forgot-password:${email}`, 3, 60 * 60 * 1000)) {
    // Same generic response — don't reveal rate limiting state either.
    return apiSuccess(null, "If an account exists for this email, a reset link has been sent.");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way — do not leak whether the email exists.
  if (user && user.isActive && !user.deletedAt) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail({ to: user.email, resetUrl: `${appUrl}/reset-password?token=${resetToken}` });
  }

  return apiSuccess(null, "If an account exists for this email, a reset link has been sent.");
});
