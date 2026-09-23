import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !(user as { id?: string }).id) {
      return NextResponse.json({ success: true, data: { banner: null } });
    }

    const userId = (user as { id: string }).id;
    const now = new Date();

    // Find the latest subscription for this user
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { updatedAt: "desc" },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, data: { banner: null } });
    }

    const activeSub = subscriptions.find((s) => s.status === "ACTIVE");
    const subToEvaluate = activeSub || subscriptions[0];

    if (!subToEvaluate || !subToEvaluate.currentPeriodEnd) {
      return NextResponse.json({ success: true, data: { banner: null } });
    }

    const cycleKey = subToEvaluate.currentPeriodEnd.toISOString().split("T")[0];
    const msDiff = subToEvaluate.currentPeriodEnd.getTime() - now.getTime();
    const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    // Case 1: Subscription is ACTIVE and expiring within 10 days
    if (subToEvaluate.status === "ACTIVE" && daysLeft <= 10 && daysLeft >= 0) {
      return NextResponse.json({
        success: true,
        data: {
          banner: {
            type: "EXPIRING_SOON",
            subscriptionId: subToEvaluate.id,
            planName: subToEvaluate.plan.name,
            daysLeft: Math.max(1, daysLeft),
            expiresOn: subToEvaluate.currentPeriodEnd.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            cancelling: subToEvaluate.cancelAtPeriodEnd,
            cycleKey,
          },
        },
      });
    }

    // Case 2: Subscription has expired within the last 30 days
    const isExpired = subToEvaluate.currentPeriodEnd < now || subToEvaluate.status === "EXPIRED";
    const daysSinceExpiry = Math.floor((now.getTime() - subToEvaluate.currentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24));

    if (isExpired && daysSinceExpiry <= 30) {
      return NextResponse.json({
        success: true,
        data: {
          banner: {
            type: "EXPIRED",
            subscriptionId: subToEvaluate.id,
            planName: subToEvaluate.plan.name,
            expiredOn: subToEvaluate.currentPeriodEnd.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            cycleKey,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: { banner: null } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch subscription status." },
      { status: 500 }
    );
  }
}
