import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { clearGuestCart } from "@/lib/guest-cart";
import { sendOrderConfirmationEmail, sendInvoiceEmail, sendDownloadLinkEmail, sendSubscriptionStartedEmail } from "@/lib/email";
import { formatMoney } from "@/lib/utils";
import type { PaymentProvider } from "@prisma/client";

export type FulfillPaymentParams = {
  orderId: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  providerOrderId?: string;
  amountReceived: number;
  currencyReceived: "INR" | "USD";
  rawPayload: unknown;
};

/**
 * Idempotent order fulfillment. Safe to call multiple times for the same
 * providerPaymentId (webhooks can and do redeliver) — the unique
 * providerPaymentId guard on Payment prevents double-processing, and
 * everything DB-side happens in one transaction so a half-applied state
 * (e.g. Order flipped to PAID but no Download rows) can never occur.
 */
export async function fulfillPayment(params: FulfillPaymentParams) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId }, include: { items: true } });
  if (!order) throw new Error("Order not found for payment fulfillment.");

  // Server is the source of truth: verify amount and currency match what we
  // actually charged for, never trust the provider payload blindly beyond
  // its cryptographic signature.
  if (params.amountReceived !== order.total) {
    throw new Error(`Amount mismatch on order ${order.orderNumber}: expected ${order.total}, received ${params.amountReceived}.`);
  }
  if (params.currencyReceived !== order.currency) {
    throw new Error(`Currency mismatch on order ${order.orderNumber}.`);
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { orderId: order.id, providerPaymentId: params.providerPaymentId },
  });
  if (existingPayment?.status === "SUCCESS") {
    // Already processed — webhook redelivery, no-op.
    return { alreadyProcessed: true, orderId: order.id };
  }

  if (order.status === "PAID") {
    // Order already fulfilled by an earlier (equivalent) confirmation.
    return { alreadyProcessed: true, orderId: order.id };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: params.provider,
        providerPaymentId: params.providerPaymentId,
        providerOrderId: params.providerOrderId,
        amount: params.amountReceived,
        currency: params.currencyReceived,
        status: "SUCCESS",
        rawPayload: params.rawPayload as any,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paymentStatus: "SUCCESS" },
    });

    const settings = await tx.storeSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    // Grant download access — one Download token per purchased product.
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.download.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          userId: order.userId,
          token: crypto.randomBytes(32).toString("hex"),
          status: "SUCCESS",
          expiresAt: new Date(Date.now() + settings.downloadExpiryMinutes * 60 * 1000),
          maxDownloads: settings.maxDownloads,
          downloadCount: 0,
        },
      });
    }

    // Activate/renew subscriptions for any plan line items. Subscriptions
    // require a registered account (enforced earlier in order-service), so
    // order.userId is guaranteed non-null whenever a plan item is present.
    for (const item of order.items) {
      if (!item.planId || !order.userId) continue;

      const plan = await tx.subscriptionPlan.findUnique({ where: { id: item.planId } });
      if (!plan) continue;

      const now = new Date();
      const periodEnd = new Date(now);
      if (plan.billingInterval === "MONTHLY") periodEnd.setMonth(periodEnd.getMonth() + 1);
      else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      // A user may already have a subscription record for this plan
      // (e.g. resubscribing after cancellation) — extend/reactivate it
      // rather than creating a duplicate, to keep one row of ongoing
      // truth per plan while still retaining full payment history via
      // SubscriptionPayment.
      const existingSub = await tx.subscription.findFirst({ where: { userId: order.userId, planId: plan.id } });

      const subscription = existingSub
        ? await tx.subscription.update({
            where: { id: existingSub.id },
            data: {
              status: "ACTIVE",
              provider: params.provider,
              currency: order.currency,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: false,
              cancelledAt: null,
            },
          })
        : await tx.subscription.create({
            data: {
              userId: order.userId,
              planId: plan.id,
              provider: params.provider,
              status: "ACTIVE",
              currency: order.currency,
              startDate: now,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });

      await tx.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          provider: params.provider,
          providerPaymentId: params.providerPaymentId,
          amount: item.price,
          currency: order.currency,
          status: "SUCCESS",
          periodStart: now,
          periodEnd,
        },
      });
    }

    // Generate invoice.
    const invoiceCount = await tx.invoice.count();
    await tx.invoice.create({
      data: {
        invoiceNumber: `INV-${String(invoiceCount + 1).padStart(6, "0")}`,
        orderId: order.id,
        userId: order.userId,
        billingName: order.billingName ?? "Customer",
        billingEmail: order.guestEmail ?? "",
        billingInfo: order.billingInfo ?? undefined,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        paymentMethod: params.provider,
      },
    });

    // Record coupon usage now that the order is actually paid
    if (order.couponId) {
      await tx.couponUsage.create({
        data: { couponId: order.couponId, userId: order.userId, orderId: order.id },
      });
    }

    // Clear the cart now that checkout succeeded.
    if (order.userId) {
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  });

  if (!order.userId) {
    // Guest cart lives in a cookie — clear it outside the DB transaction.
    clearGuestCart();
  }

  // Send transactional emails — best-effort, never blocks fulfillment if
  // delivery fails (see lib/email.ts).
  const recipientEmail = order.userId
    ? (await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } }))?.email
    : order.guestEmail;

  if (recipientEmail) {
    const totalDisplay = formatMoney(order.total, order.currency);
    await sendOrderConfirmationEmail({ to: recipientEmail, orderNumber: order.orderNumber, total: totalDisplay });

    const invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
    if (invoice) {
      await sendInvoiceEmail({
        to: recipientEmail,
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: order.orderNumber,
        total: totalDisplay,
      });
    }

    const downloads = await prisma.download.findMany({
      where: { orderId: order.id },
      include: { product: { select: { title: true } } },
    });
    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    for (const download of downloads) {
      await sendDownloadLinkEmail({
        to: recipientEmail,
        productTitle: download.product.title,
        downloadUrl: `${appUrl}/api/downloads/${download.token}`,
      });
    }

    const planItems = order.items.filter((i) => i.planId);
    for (const item of planItems) {
      await sendSubscriptionStartedEmail({ to: recipientEmail, planName: item.itemTitle });
    }
  }

  return { alreadyProcessed: false, orderId: order.id };
}

/**
 * Fulfills an order whose total is 0 (free products, a coupon that zeroes
 * out the total, etc.) — grants access identically to a paid order, but
 * skips creating a Payment row and never touches any provider, since no
 * money moved. Section requirement: free content should be accessible
 * directly, without a payment method step.
 */
export async function fulfillFreeOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("Order not found for free fulfillment.");
  if (order.total !== 0) throw new Error("fulfillFreeOrder called on a non-zero order.");
  if (order.status === "PAID") return { alreadyProcessed: true, orderId: order.id };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paymentStatus: "SUCCESS" } });

    const settings = await tx.storeSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.download.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          userId: order.userId,
          token: crypto.randomBytes(32).toString("hex"),
          status: "SUCCESS",
          expiresAt: new Date(Date.now() + settings.downloadExpiryMinutes * 60 * 1000),
          maxDownloads: settings.maxDownloads,
          downloadCount: 0,
        },
      });
    }

    const invoiceCount = await tx.invoice.count();
    await tx.invoice.create({
      data: {
        invoiceNumber: `INV-${String(invoiceCount + 1).padStart(6, "0")}`,
        orderId: order.id,
        userId: order.userId,
        billingName: order.billingName ?? "Customer",
        billingEmail: order.guestEmail ?? "",
        billingInfo: order.billingInfo ?? undefined,
        subtotal: order.subtotal,
        discount: order.discount,
        total: 0,
        currency: order.currency,
        paymentMethod: null,
      },
    });

    // Record coupon usage for 100% discounted free order
    if (order.couponId) {
      await tx.couponUsage.create({
        data: { couponId: order.couponId, userId: order.userId, orderId: order.id },
      });
    }

    if (order.userId) {
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  });

  if (!order.userId) clearGuestCart();

  const recipientEmail = order.userId
    ? (await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } }))?.email
    : order.guestEmail;

  if (recipientEmail) {
    await sendOrderConfirmationEmail({ to: recipientEmail, orderNumber: order.orderNumber, total: "Free" });
    const downloads = await prisma.download.findMany({ where: { orderId: order.id }, include: { product: { select: { title: true } } } });
    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    for (const download of downloads) {
      await sendDownloadLinkEmail({
        to: recipientEmail,
        productTitle: download.product.title,
        downloadUrl: `${appUrl}/api/downloads/${download.token}`,
      });
    }
  }

  return { alreadyProcessed: false, orderId: order.id };
}

export async function markPaymentFailed(orderId: string, provider: PaymentProvider, rawPayload: unknown) {
  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: { orderId, provider, status: "FAILED", amount: 0, currency: "INR", rawPayload: rawPayload as any },
    });
    await tx.order.update({ where: { id: orderId }, data: { status: "FAILED", paymentStatus: "FAILED" } });
  });
}
