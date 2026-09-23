import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPaymentSignature } from "@/lib/payments/razorpay";
import { fulfillPayment } from "@/lib/fulfill-payment";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const verifySchema = z.object({
  orderNumber: z.string().trim().min(1),
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
});

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const isValid = verifyRazorpayPaymentSignature({
    razorpayOrderId: parsed.data.razorpayOrderId,
    razorpayPaymentId: parsed.data.razorpayPaymentId,
    razorpaySignature: parsed.data.razorpaySignature,
  });

  if (!isValid) {
    return apiError("Payment signature verification failed. If money was deducted, it will be refunded automatically.", [], 400);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
    include: { payments: true },
  });
  if (!order) return apiError("Order not found.", [], 404);

  // If already paid and fulfilled (e.g. concurrent webhook), return success idempotently
  if (order.status === "PAID" && order.paymentStatus === "SUCCESS") {
    return apiSuccess({ orderNumber: order.orderNumber }, "Payment verified successfully.");
  }

  // Cryptographic binding verification: ensure this razorpayOrderId was actually generated for this specific order
  const matchingPayment = order.payments.find(
    (p) => p.providerOrderId === parsed.data.razorpayOrderId && p.provider === "RAZORPAY"
  );
  if (!matchingPayment && order.payments.length > 0) {
    // There are recorded payments for this order, but none match this razorpayOrderId
    return apiError("Payment reference does not match this order.", [], 400);
  }

  await fulfillPayment({
    orderId: order.id,
    provider: "RAZORPAY",
    providerPaymentId: parsed.data.razorpayPaymentId,
    providerOrderId: parsed.data.razorpayOrderId,
    amountReceived: order.total,
    currencyReceived: order.currency,
    rawPayload: parsed.data,
  });

  return apiSuccess({ orderNumber: order.orderNumber }, "Payment verified successfully.");
});
