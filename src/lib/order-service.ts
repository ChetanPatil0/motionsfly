import { prisma } from "@/lib/prisma";
import { nextOrderNumber } from "@/lib/order-number";
import { getResolvedCart } from "@/lib/cart";
import { validateAndComputeCoupon } from "@/lib/coupon";
import type { Currency, PaymentProvider } from "@prisma/client";

export type CreateOrderParams = {
  userId: string | null;
  guestEmail: string | null;
  billingName: string;
  billingInfo: Record<string, string>;
  countryCode: string;
  preferredCurrency?: Currency;
  couponCode?: string;
  provider: PaymentProvider;
};

export async function createPendingOrder(params: CreateOrderParams) {
  const cart = await getResolvedCart(params.userId, params.countryCode, params.preferredCurrency);

  if (cart.lines.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const hasSubscriptionPlan = cart.lines.some((line) => line.type === "SUBSCRIPTION_PLAN");
  if (hasSubscriptionPlan && !params.userId) {
    throw new Error("You must be logged in to purchase a subscription.");
  }

  let discount = 0;
  let couponId: string | null = null;

  if (params.couponCode) {
    const result = await validateAndComputeCoupon(params.couponCode, cart.subtotal, params.userId);
    if (!result.valid) throw new Error(result.message);
    discount = result.discount;
    couponId = result.couponId;
  }

  const total = Math.max(0, cart.subtotal - discount);

  // Retry a couple of times in the rare event of an orderNumber collision
  // under concurrent checkouts (unique constraint enforces correctness).
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const orderNumber = await nextOrderNumber();

      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNumber,
            userId: params.userId,
            guestEmail: params.userId ? null : params.guestEmail,
            billingName: params.billingName,
            billingInfo: params.billingInfo,
            subtotal: cart.subtotal,
            discount,
            total,
            currency: cart.currency as Currency,
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentMethod: params.provider,
            couponId,
            items: {
              create: cart.lines.map((line) => ({
                productId: line.type === "PRODUCT" ? line.refId : undefined,
                tutorialId: line.type === "TUTORIAL" ? line.refId : undefined,
                planId: line.type === "SUBSCRIPTION_PLAN" ? line.refId : undefined,
                itemTitle: line.title,
                price: line.unitPrice,
                currency: cart.currency as Currency,
                quantity: line.quantity,
              })),
            },
          },
          include: { items: true },
        });

        return created;
      });

      return order;
    } catch (err: any) {
      if (err?.code === "P2002" && attempt < 2) continue; // orderNumber collision — retry
      throw err;
    }
  }

  throw new Error("Unable to create order. Please try again.");
}
