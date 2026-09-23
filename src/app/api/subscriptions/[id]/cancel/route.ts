import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendSubscriptionCancelledEmail } from "@/lib/email";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  if (!user) return apiError("You must be logged in.", [], 401);

  const subscription = await prisma.subscription.findUnique({
    where: { id: params.id },
    include: { plan: true, user: { select: { email: true } } },
  });

  if (!subscription || subscription.userId !== (user as { id: string }).id) {
    return apiError("Subscription not found.", [], 404);
  }

  if (subscription.status !== "ACTIVE") {
    return apiError("Only active subscriptions can be cancelled.", [], 400);
  }

  if (subscription.cancelAtPeriodEnd) {
    return apiError("This subscription is already scheduled for cancellation.", [], 400);
  }

  // Prorated loyalty-point credit for the unused portion of the current
  // billing period, so cancelling mid-cycle doesn't simply forfeit it.
  const now = Date.now();
  const periodStart = subscription.currentPeriodStart.getTime();
  const periodEnd = subscription.currentPeriodEnd.getTime();
  const totalPeriodMs = Math.max(1, periodEnd - periodStart);
  const remainingMs = Math.max(0, periodEnd - now);
  const remainingFraction = Math.min(1, remainingMs / totalPeriodMs);

  const planPrice = subscription.currency === "INR" ? subscription.plan.priceINR : subscription.plan.priceUSD;
  const remainingValueMinorUnits = Math.round(planPrice * remainingFraction);

  const settings = await prisma.storeSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  const pointsAwarded = Math.round((remainingValueMinorUnits / 100) * settings.pointsPerCurrencyUnit);

  const updated = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true, cancelledAt: new Date() },
    });

    if (pointsAwarded > 0) {
      await tx.user.update({
        where: { id: subscription.userId },
        data: { loyaltyPoints: { increment: pointsAwarded } },
      });
      await tx.pointsLedger.create({
        data: {
          userId: subscription.userId,
          points: pointsAwarded,
          reason: `Prorated credit for cancelling ${subscription.plan.name} with ${Math.round(remainingFraction * 100)}% of the period remaining`,
        },
      });
    }

    return sub;
  });

  await sendSubscriptionCancelledEmail({
    to: subscription.user.email,
    planName: subscription.plan.name,
    accessUntil: subscription.currentPeriodEnd.toLocaleDateString(),
  });

  return apiSuccess(
    updated,
    pointsAwarded > 0
      ? `Your subscription will be cancelled at the end of the current billing period. You've earned ${pointsAwarded} loyalty points for the unused time.`
      : "Your subscription will be cancelled at the end of the current billing period."
  );
});
