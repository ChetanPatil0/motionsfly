import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { nextOrderNumber } from "@/lib/order-number";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (!user || !(user as { id?: string }).id) {
    return apiError("Please sign in to download this product.", [], 401);
  }

  const userId = (user as { id: string }).id;
  const role = (user as { role?: string }).role;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { files: true },
  });

  if (!product || !product.isPublished || product.deletedAt) {
    return apiError("Product not found or unavailable.", [], 404);
  }

  if (product.files.length === 0) {
    return apiError("No downloadable files are attached to this product yet.", [], 404);
  }

  // Determine eligibility
  const isAdmin = role === "ADMIN";
  const isFree = product.isFree;

  let isSubscribed = false;
  if (!isAdmin && product.isPremium) {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodEnd: { gt: new Date() },
      },
    });
    isSubscribed = !!sub;
  }

  let hasPurchased = false;
  if (!isAdmin && !isFree && !isSubscribed) {
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId,
          status: "PAID",
          paymentStatus: "SUCCESS",
        },
      },
    });
    hasPurchased = !!purchase;
  }

  const isAuthorized = isAdmin || isFree || isSubscribed || hasPurchased;
  if (!isAuthorized) {
    return apiError("Active PRO subscription or purchase required to download this asset.", [], 403);
  }

  // Check for an existing valid download token for this user & product
  const existingDownload = await prisma.download.findFirst({
    where: {
      userId,
      productId: product.id,
      expiresAt: { gt: new Date() },
      status: "SUCCESS",
      order: { status: "PAID" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingDownload && existingDownload.downloadCount < existingDownload.maxDownloads) {
    return apiSuccess({
      downloadUrl: `/api/downloads/${existingDownload.token}`,
      expiresAt: existingDownload.expiresAt,
      remaining: existingDownload.maxDownloads - existingDownload.downloadCount,
    });
  }

  // Create an authorized access order and download token
  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const orderNumber = await nextOrderNumber();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + settings.downloadExpiryMinutes * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        billingName: (user as { name?: string }).name ?? "Subscriber",
        billingInfo: {},
        subtotal: 0,
        discount: 0,
        total: 0,
        currency: "INR",
        status: "PAID",
        paymentStatus: "SUCCESS",
        paymentMethod: null,
        items: {
          create: [
            {
              productId: product.id,
              itemTitle: product.title,
              price: 0,
              currency: "INR",
              quantity: 1,
            },
          ],
        },
      },
    });

    await tx.download.create({
      data: {
        orderId: order.id,
        productId: product.id,
        userId,
        token,
        status: "SUCCESS",
        expiresAt,
        maxDownloads: settings.maxDownloads,
        downloadCount: 0,
      },
    });
  });

  return apiSuccess({
    downloadUrl: `/api/downloads/${token}`,
    expiresAt,
    remaining: settings.maxDownloads,
  });
});
