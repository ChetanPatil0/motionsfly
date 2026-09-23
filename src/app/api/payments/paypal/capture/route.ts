import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { capturePaypalOrder, getPaypalOrder } from "@/lib/payments/paypal";
import { fulfillPayment } from "@/lib/fulfill-payment";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const captureSchema = z.object({ orderNumber: z.string(), paypalOrderId: z.string() });

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const parsed = captureSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const order = await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber } });
  if (!order) return apiError("Order not found.", [], 404);

  // If order is already fulfilled (e.g. captured previously or by webhook), return success idempotently
  if (order.status === "PAID" && order.paymentStatus === "SUCCESS") {
    return apiSuccess({ orderNumber: order.orderNumber }, "Payment already verified.");
  }

  // Server-to-server call to PayPal
  let captureResult: any;
  try {
    captureResult = await capturePaypalOrder(parsed.data.paypalOrderId);
  } catch (err: any) {
    const errMsg = String(err?.message || "");

    // If order was already captured at PayPal (e.g. concurrent request or double-fire), verify status
    if (errMsg.includes("ORDER_ALREADY_CAPTURED") || errMsg.includes("UNPROCESSABLE_ENTITY")) {
      const refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      if (refreshedOrder?.status === "PAID") {
        return apiSuccess({ orderNumber: refreshedOrder.orderNumber }, "Payment verified successfully.");
      }

      // Fetch captured details from PayPal
      try {
        const orderDetails = await getPaypalOrder(parsed.data.paypalOrderId);
        if (orderDetails.status === "COMPLETED") {
          const capture = orderDetails.purchase_units?.[0]?.payments?.captures?.[0];
          const amountReceived = Math.round(parseFloat(capture?.amount?.value ?? "0") * 100);
          const currencyReceived = capture?.amount?.currency_code ?? "USD";

          await fulfillPayment({
            orderId: order.id,
            provider: "PAYPAL",
            providerPaymentId: capture?.id ?? parsed.data.paypalOrderId,
            providerOrderId: parsed.data.paypalOrderId,
            amountReceived,
            currencyReceived,
            rawPayload: orderDetails,
          });

          return apiSuccess({ orderNumber: order.orderNumber }, "Payment captured successfully.");
        }
      } catch {
        // Fall through to error
      }
    }
    throw err;
  }

  if (captureResult.status !== "COMPLETED") {
    return apiError("Payment could not be confirmed.", [], 400);
  }

  const capture = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
  const amountReceived = Math.round(parseFloat(capture?.amount?.value ?? "0") * 100);
  const currencyReceived = capture?.amount?.currency_code ?? "USD";

  await fulfillPayment({
    orderId: order.id,
    provider: "PAYPAL",
    providerPaymentId: capture?.id ?? parsed.data.paypalOrderId,
    providerOrderId: parsed.data.paypalOrderId,
    amountReceived,
    currencyReceived,
    rawPayload: captureResult,
  });

  return apiSuccess({ orderNumber: order.orderNumber }, "Payment captured successfully.");
});
