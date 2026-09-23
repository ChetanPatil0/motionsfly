import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { createPendingOrder } from "@/lib/order-service";
import { checkoutSchema } from "@/schemas/checkout";
import { getStoreSettings } from "@/lib/store-settings";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { createStripeCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe";
import { createPaypalOrder, isPaypalConfigured } from "@/lib/payments/paypal";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request) => {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const settings = await getStoreSettings();

  if (settings.isMaintenance) {
    return apiError("The store is currently in maintenance mode. Checkouts are temporarily paused.", [], 503);
  }
  if (!settings.storeActive) {
    return apiError("The store is currently inactive and not accepting new orders.", [], 503);
  }

  const providerFlags: Record<string, boolean> = {
    RAZORPAY: settings.razorpayEnabled,
    STRIPE: settings.stripeEnabled,
    PAYPAL: settings.paypalEnabled,
  };
  if (!providerFlags[parsed.data.provider]) {
    return apiError("The selected payment method is currently unavailable.", [], 400);
  }

  // PayPal REST API does NOT support INR (Indian Rupee).
  // Cross-border PayPal orders must always be billed in USD.
  const isPaypal = parsed.data.provider === "PAYPAL";
  const preferredCurrency = isPaypal
    ? "USD"
    : (cookies().get("mf_currency_view")?.value as "INR" | "USD" | undefined);
  const countryCode =
    cookies().get("mf_country")?.value ??
    parsed.data.billingCountry ??
    (preferredCurrency === "USD" ? "US" : "IN");

  let order;
  try {
    order = await createPendingOrder({
      userId: user ? (user as { id: string }).id : null,
      guestEmail: user ? null : parsed.data.email,
      billingName: parsed.data.billingName,
      billingInfo: {
        address: parsed.data.billingAddress,
        city: parsed.data.billingCity,
        country: parsed.data.billingCountry,
        postalCode: parsed.data.billingPostalCode,
      },
      countryCode,
      preferredCurrency,
      couponCode: parsed.data.couponCode,
      provider: parsed.data.provider,
    });
  } catch (err: any) {
    return apiError(err?.message ?? "Unable to create order.", [], 400);
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (parsed.data.provider === "RAZORPAY") {
    if (!isRazorpayConfigured()) {
      return apiError(
        "Something went wrong. Please try again or choose another payment method.",
        [],
        400
      );
    }
    const rpOrder = await createRazorpayOrder(order.total, order.currency, order.orderNumber);
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "RAZORPAY",
        providerOrderId: rpOrder.id,
        amount: order.total,
        currency: order.currency,
        status: "PENDING",
      },
    });
    return apiSuccess(
      { order, providerData: { razorpayOrderId: rpOrder.id, keyId: process.env.RAZORPAY_KEY_ID } },
      "Order created."
    );
  }

  if (parsed.data.provider === "STRIPE") {
    if (!isStripeConfigured()) {
      return apiError(
        "Something went wrong. Please try again or choose another payment method.",
        [],
        400
      );
    }
    const session = await createStripeCheckoutSession({
      amount: order.total,
      currency: order.currency.toLowerCase(),
      orderId: order.id,
      successUrl: `${appUrl}/checkout/success?order=${order.orderNumber}`,
      cancelUrl: `${appUrl}/checkout?cancelled=1`,
      customerEmail: parsed.data.email,
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "STRIPE",
        providerOrderId: session.id,
        amount: order.total,
        currency: order.currency,
        status: "PENDING",
      },
    });
    return apiSuccess({ order, providerData: { checkoutUrl: session.url } }, "Order created.");
  }

  // PAYPAL — Billed in USD (PayPal REST API rejects INR transactions)
  if (!isPaypalConfigured()) {
    return apiError(
      "Something went wrong. Please try again or contact support.",
      [],
      400
    );
  }

  try {
    const ppOrder = await createPaypalOrder({
      amountMajorUnits: (order.total / 100).toFixed(2),
      currency: "USD",
      orderId: order.id,
      returnUrl: `${appUrl}/checkout/paypal/capture?order=${order.orderNumber}`,
      cancelUrl: `${appUrl}/checkout/paypal/cancel?order=${order.orderNumber}`,
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "PAYPAL",
        providerOrderId: ppOrder.id,
        amount: order.total,
        currency: order.currency,
        status: "PENDING",
      },
    });
    return apiSuccess({ order, providerData: { approveUrl: ppOrder.approveUrl, paypalOrderId: ppOrder.id } }, "Order created.");
  } catch (err: any) {
    return apiError(err?.message ?? "PayPal order initialization failed. Please try again.", [], 400);
  }
});
