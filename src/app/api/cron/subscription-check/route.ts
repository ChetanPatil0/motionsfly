import { prisma } from "@/lib/prisma";
import { sendSubscriptionExpiringEmail, sendSubscriptionExpiredEmail } from "@/lib/email";
import { apiError, apiSuccess } from "@/lib/api-response";
import { isSubscriptionNotified, recordSubscriptionNotification } from "@/lib/subscription-notifications";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Expiry notice triggered 10 days ahead
const EXPIRY_WARNING_WINDOW_DAYS = 10;

async function handleSubscriptionChecks(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;

  // Fail-closed authorization: must have a valid secret or be an authenticated Admin
  const isSecretValid = Boolean(cronSecret && secret && secret === cronSecret);
  if (!isSecretValid) {
    const user = await getCurrentUser();
    const isAdmin = (user as { role?: string } | null)?.role === "ADMIN";
    if (!isAdmin) {
      return apiError("Unauthorized cron invocation.", [], 401);
    }
  }

  const now = new Date();
  const warningThreshold = new Date(now.getTime() + EXPIRY_WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // 1. Process Subscriptions expiring within the 10-day window (on time only)
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      currentPeriodEnd: { gte: now, lte: warningThreshold },
    },
    include: {
      plan: true,
      user: { select: { email: true } },
    },
  });

  let expiringNotifiedCount = 0;
  for (const sub of expiringSoon) {
    const cycleKey = sub.currentPeriodEnd.toISOString().slice(0, 10);
    const msLeft = sub.currentPeriodEnd.getTime() - now.getTime();
    const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

    // Send exactly once per billing period cycle
    if (!isSubscriptionNotified(sub.id, "EXPIRING_10_DAYS", cycleKey)) {
      if (sub.user?.email) {
        await sendSubscriptionExpiringEmail({
          to: sub.user.email,
          planName: sub.plan.name,
          expiresOn: sub.currentPeriodEnd.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          daysLeft,
        });
        recordSubscriptionNotification(sub.id, "EXPIRING_10_DAYS", cycleKey);
        expiringNotifiedCount++;
      }
    }
  }

  // 2. Process Subscriptions that have expired
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      currentPeriodEnd: { lt: now },
      OR: [
        { status: "ACTIVE" },
        { status: "EXPIRED" },
      ],
    },
    include: {
      plan: true,
      user: { select: { email: true } },
    },
  });

  let expiredNotifiedCount = 0;
  let expiredStatusUpdatedCount = 0;

  for (const sub of expiredSubs) {
    const cycleKey = sub.currentPeriodEnd.toISOString().slice(0, 10);

    // Send expired notification exactly once
    if (!isSubscriptionNotified(sub.id, "EXPIRED", cycleKey)) {
      if (sub.user?.email) {
        await sendSubscriptionExpiredEmail({
          to: sub.user.email,
          planName: sub.plan.name,
          expiredOn: sub.currentPeriodEnd.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        });
        recordSubscriptionNotification(sub.id, "EXPIRED", cycleKey);
        expiredNotifiedCount++;
      }
    }

    // Mark as EXPIRED if still marked ACTIVE
    if (sub.status === "ACTIVE") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      });
      expiredStatusUpdatedCount++;
    }
  }

  return apiSuccess(
    {
      expiringChecked: expiringSoon.length,
      expiringNotifiedCount,
      expiredChecked: expiredSubs.length,
      expiredNotifiedCount,
      expiredStatusUpdatedCount,
      timestamp: now.toISOString(),
    },
    "Subscription expiry check completed successfully."
  );
}

export async function GET(req: Request) {
  try {
    return await handleSubscriptionChecks(req);
  } catch (error: any) {
    return apiError(error.message || "Failed to process subscription check.", [], 500);
  }
}

export async function POST(req: Request) {
  try {
    return await handleSubscriptionChecks(req);
  } catch (error: any) {
    return apiError(error.message || "Failed to process subscription check.", [], 500);
  }
}
