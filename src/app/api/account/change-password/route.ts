import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export const POST = withErrorHandling(async (req: Request) => {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return apiError("Unauthorized.", [], 401);

  const userId = (sessionUser as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    return apiError("User account not found or cannot change password.", [], 400);
  }

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed.", parsed.error.issues, 422);
  }

  const isCurrentValid = await argon2.verify(user.passwordHash, parsed.data.currentPassword);
  if (!isCurrentValid) {
    return apiError("Incorrect current password.", [], 400);
  }

  const isSamePassword = await argon2.verify(user.passwordHash, parsed.data.newPassword);
  if (isSamePassword) {
    return apiError("New password cannot be the same as your current password.", [], 400);
  }

  const newHash = await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id });
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return apiSuccess(null, "Your password has been changed successfully.");
});
