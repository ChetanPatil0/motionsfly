import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AccountOrdersClient, type OrderListItem } from "@/components/account-orders-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order History | MotionFly",
  description: "View and manage your past and pending MotionFly orders.",
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: (user as { id: string }).id },
    include: {
      items: {
        select: {
          id: true,
          itemTitle: true,
          price: true,
          quantity: true,
          planId: true,
        },
      },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serializedOrders: OrderListItem[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    currency: o.currency,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt.toISOString(),
    items: o.items,
    invoice: o.invoice,
  }));

  return <AccountOrdersClient initialOrders={serializedOrders} />;
}

