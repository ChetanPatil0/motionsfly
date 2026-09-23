import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendContactFormEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  message: z.string().trim().min(10).max(2000),
});

export const POST = withErrorHandling(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return apiError("Too many messages sent. Please try again later.", [], 429);
  }

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const settings = await prisma.storeSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  const supportEmail = settings.supportEmail || settings.storeEmail;

  if (!supportEmail) {
    return apiError("This form is not yet configured. Please try again later.", [], 500);
  }

  await sendContactFormEmail({
    to: supportEmail,
    fromName: parsed.data.name,
    fromEmail: parsed.data.email,
    message: parsed.data.message,
  });

  return apiSuccess(null, "Message sent successfully.");
});
