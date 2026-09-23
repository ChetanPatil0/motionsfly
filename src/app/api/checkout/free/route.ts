import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { createPendingOrder } from "@/lib/order-service";
import { fulfillFreeOrder } from "@/lib/fulfill-payment";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const freeCheckoutSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  billingName: z.string().trim().min(2).max(150),
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = freeCheckoutSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const { prisma } = await import("@/lib/prisma");
  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  if (settings.isMaintenance) {
    return apiError("The store is currently in maintenance mode. Checkouts are temporarily paused.", [], 503);
  }
  if (!settings.storeActive) {
    return apiError("The store is currently inactive and not accepting new orders.", [], 503);
  }

  const countryCode = cookies().get("mf_country")?.value ?? "IN";

  let order;
  try {
    order = await createPendingOrder({
      userId: user ? (user as { id: string }).id : null,
      guestEmail: user ? null : parsed.data.email,
      billingName: parsed.data.billingName,
      billingInfo: {},
      countryCode,
      provider: "RAZORPAY", // nominal — no provider is actually charged for a $0 order
    });
  } catch (err: any) {
    return apiError(err?.message ?? "Unable to create order.", [], 400);
  }

  if (order.total !== 0) {
    return apiError("This cart is not free. Please choose a payment method.", [], 400);
  }

  await fulfillFreeOrder(order.id);

  return apiSuccess({ orderNumber: order.orderNumber }, "Access granted successfully.");
});
