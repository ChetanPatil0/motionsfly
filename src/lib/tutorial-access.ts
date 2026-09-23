import { prisma } from "@/lib/prisma";

export async function hasTutorialAccess(userId: string | null, tutorial: { id: string; accessType: "FREE" | "PAID" | "PREMIUM" }): Promise<boolean> {
  if (tutorial.accessType === "FREE") return true;
  if (!userId) return false;

  if (tutorial.accessType === "PAID") {
    const purchased = await prisma.orderItem.findFirst({
      where: {
        tutorialId: tutorial.id,
        order: { userId, status: "PAID", paymentStatus: "SUCCESS" },
      },
    });
    return !!purchased;
  }

  if (tutorial.accessType === "PREMIUM") {
    const activeSub = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE", currentPeriodEnd: { gte: new Date() } },
    });
    return !!activeSub;
  }

  return false;
}
