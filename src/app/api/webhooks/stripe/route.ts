import { prisma } from "@/lib/prisma";
import { verifyStripeWebhookSignature } from "@/lib/payments/stripe";
import { fulfillPayment } from "@/lib/fulfill-payment";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request) => {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !verifyStripeWebhookSignature(rawBody, signature)) {
    return apiError("Invalid webhook signature.", [], 400);
  }

  const event = JSON.parse(rawBody);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order) {
        await fulfillPayment({
          orderId: order.id,
          provider: "STRIPE",
          providerPaymentId: session.payment_intent ?? session.id,
          providerOrderId: session.id,
          amountReceived: session.amount_total,
          currencyReceived: (session.currency ?? "usd").toUpperCase() as "USD",
          rawPayload: event,
        });
      }
    }
  }

  return apiSuccess(null, "Webhook processed.");
});
