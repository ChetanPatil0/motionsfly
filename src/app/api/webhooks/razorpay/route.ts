import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { fulfillPayment, markPaymentFailed } from "@/lib/fulfill-payment";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return apiError("Invalid webhook signature.", [], 400);
  }

  const event = JSON.parse(rawBody);
  const paymentEntity = event?.payload?.payment?.entity;

  if (event.event === "payment.captured" && paymentEntity) {
    const receipt = paymentEntity.order_id
      ? null // receipt not directly on payment entity; look up via order notes/receipt if needed
      : null;
    const orderNumber = paymentEntity.notes?.orderNumber ?? receipt;

    const order = orderNumber
      ? await prisma.order.findUnique({ where: { orderNumber } })
      : await prisma.order.findFirst({
          where: { payments: { some: { providerOrderId: paymentEntity.order_id } } },
        });

    if (order) {
      await fulfillPayment({
        orderId: order.id,
        provider: "RAZORPAY",
        providerPaymentId: paymentEntity.id,
        providerOrderId: paymentEntity.order_id,
        amountReceived: paymentEntity.amount,
        currencyReceived: paymentEntity.currency,
        rawPayload: event,
      });
    }
  }

  if (event.event === "payment.failed" && paymentEntity) {
    const order = await prisma.order.findFirst({
      where: { payments: { some: { providerOrderId: paymentEntity.order_id } } },
    });
    if (order) await markPaymentFailed(order.id, "RAZORPAY", event);
  }

  return apiSuccess(null, "Webhook processed.");
});
