import { prisma } from "@/lib/prisma";
import { verifyPaypalWebhookSignature } from "@/lib/payments/paypal";
import { fulfillPayment } from "@/lib/fulfill-payment";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request) => {
  const rawBody = await req.text();
  const event = JSON.parse(rawBody);

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return apiError("PayPal webhook is not configured.", [], 500);

  const verified = await verifyPaypalWebhookSignature({
    transmissionId: req.headers.get("paypal-transmission-id") ?? "",
    transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
    certUrl: req.headers.get("paypal-cert-url") ?? "",
    authAlgo: req.headers.get("paypal-auth-algo") ?? "",
    transmissionSig: req.headers.get("paypal-transmission-sig") ?? "",
    webhookId,
    webhookEvent: event,
  });

  if (!verified) return apiError("Invalid webhook signature.", [], 400);

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resource = event.resource;
    const orderNumber = resource?.custom_id;
    const order = orderNumber
      ? await prisma.order.findUnique({ where: { orderNumber } })
      : null;

    if (order) {
      const amountReceived = Math.round(parseFloat(resource.amount?.value ?? "0") * 100);
      await fulfillPayment({
        orderId: order.id,
        provider: "PAYPAL",
        providerPaymentId: resource.id,
        amountReceived,
        currencyReceived: resource.amount?.currency_code ?? "USD",
        rawPayload: event,
      });
    }
  }

  return apiSuccess(null, "Webhook processed.");
});
