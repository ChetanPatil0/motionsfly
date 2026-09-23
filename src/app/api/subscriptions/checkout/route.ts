import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { nextOrderNumber } from "@/lib/order-number";
import { validateAndComputeCoupon } from "@/lib/coupon";
import { getStoreSettings } from "@/lib/store-settings";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { createStripeCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe";
import { createPaypalOrder, isPaypalConfigured } from "@/lib/payments/paypal";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import type { Currency, PaymentProvider } from "@prisma/client";
import { z } from "zod";

const subscriptionCheckoutSchema = z.object({
  planId: z.string().min(1, "Plan ID is required."),
  provider: z.enum(["RAZORPAY", "STRIPE", "PAYPAL"] as const),
  billingName: z.string().min(2, "Billing name is required."),
  billingCountry: z.string().length(2, "Country code required.").default("IN"),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  couponCode: z.string().optional(),
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("You must be logged in to purchase a subscription.", [], 401);
  }

  const userId = (user as { id: string }).id;
  const body = await req.json();
  const parsed = subscriptionCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid subscription input.", parsed.error.issues, 422);
  }

  const settings = await getStoreSettings();
  if (settings.isMaintenance) {
    return apiError("Store maintenance in progress. Subscription checkouts temporarily paused.", [], 503);
  }
  if (!settings.storeActive) {
    return apiError("The store is currently inactive.", [], 503);
  }

  const providerFlags: Record<string, boolean> = {
    RAZORPAY: settings.razorpayEnabled,
    STRIPE: settings.stripeEnabled,
    PAYPAL: settings.paypalEnabled,
  };
  if (!providerFlags[parsed.data.provider]) {
    return apiError("The selected payment method is currently disabled.", [], 400);
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: parsed.data.planId, isActive: true },
  });
  if (!plan) {
    return apiError("Subscription plan not found or no longer active.", [], 404);
  }

  // PayPal REST API does NOT support INR transactions. Enforce USD for PayPal subscriptions.
  const isPaypal = parsed.data.provider === "PAYPAL";
  const cookieStore = cookies();
  const rawCurrency =
    (cookieStore.get("NEXT_CURRENCY")?.value as Currency | undefined) ||
    (cookieStore.get("mf_currency_view")?.value as Currency | undefined) ||
    ((user as { country?: string }).country === "IN" ? "INR" : "USD");

  const preferredCurrency: Currency = isPaypal ? "USD" : rawCurrency;

  const basePrice = preferredCurrency === "INR" ? plan.priceINR : plan.priceUSD;

  let discount = 0;
  let couponId: string | null = null;
  if (parsed.data.couponCode) {
    const couponRes = await validateAndComputeCoupon(parsed.data.couponCode, basePrice, userId);
    if (!couponRes.valid) return apiError(couponRes.message, [], 400);
    discount = couponRes.discount;
    couponId = couponRes.couponId;
  }

  const total = Math.max(0, basePrice - discount);

  // Retry up to 3 times in case of order number collision
  let order;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const orderNumber = await nextOrderNumber();
      order = await prisma.$transaction(async (tx) => {
        return tx.order.create({
          data: {
            orderNumber,
            userId,
            billingName: parsed.data.billingName,
            billingInfo: {
              address: parsed.data.billingAddress ?? "",
              city: parsed.data.billingCity ?? "",
              country: parsed.data.billingCountry,
              postalCode: parsed.data.billingPostalCode ?? "",
            },
            subtotal: basePrice,
            discount,
            total,
            currency: preferredCurrency,
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentMethod: parsed.data.provider as PaymentProvider,
            couponId,
            items: {
              create: [
                {
                  planId: plan.id,
                  itemTitle: `MotionFly PRO — ${plan.name}`,
                  price: total,
                  currency: preferredCurrency,
                  quantity: 1,
                },
              ],
            },
          },
          include: { items: true },
        });
      });
      break;
    } catch (e: any) {
      if (attempt === 2) throw e;
    }
  }

  if (!order) {
    return apiError("Failed to initialize subscription order.", [], 500);
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // Handle Free / 100% Discounted subscription order
  if (total === 0) {
    return apiSuccess({ order, isFree: true }, "Subscription initialized.");
  }

  if (parsed.data.provider === "RAZORPAY") {
    if (!isRazorpayConfigured()) {
      return apiError(
        "Something went wrong. Please try again or choose another payment method.",
        [],
        400
      );
    }
    const rpOrder = await createRazorpayOrder(order.total, order.currency, order.orderNumber);
    return apiSuccess(
      {
        order,
        providerData: { razorpayOrderId: rpOrder.id, keyId: process.env.RAZORPAY_KEY_ID },
      },
      "Subscription order created."
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
      successUrl: `${appUrl}/subscriptions/success?order=${order.orderNumber}`,
      cancelUrl: `${appUrl}/subscriptions/checkout?planId=${plan.id}&cancelled=1`,
      customerEmail: (user as { email?: string }).email ?? "",
    });
    return apiSuccess({ order, providerData: { checkoutUrl: session.url } }, "Subscription order created.");
  }

  // PAYPAL — Billed in USD
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
      returnUrl: `${appUrl}/checkout/paypal/capture?order=${order.orderNumber}&sub=1`,
      cancelUrl: `${appUrl}/subscriptions/checkout?planId=${plan.id}&cancelled=1`,
    });

    return apiSuccess(
      {
        order,
        providerData: { approveUrl: ppOrder.approveUrl, paypalOrderId: ppOrder.id },
      },
      "Subscription order created."
    );
  } catch (err: any) {
    return apiError(err?.message ?? "PayPal subscription initialization failed. Please try again.", [], 400);
  }
});
