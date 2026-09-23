import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return apiError("Order not found.", [], 404);
  if (order.status !== "PAID") return apiError("Only paid orders can be refunded.", [], 400);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED", paymentStatus: "REFUNDED" } });
    await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "REFUNDED" } });
    // Revoke access immediately — expire every download token tied to this
    // order rather than leaving live links to paid content around.
    await tx.download.updateMany({
      where: { orderId: order.id },
      data: { status: "EXPIRED", expiresAt: new Date() },
    });
  });

  return apiSuccess(null, "Order refunded and download access revoked.");
});
