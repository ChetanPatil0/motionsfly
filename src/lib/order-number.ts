import { prisma } from "@/lib/prisma";

/**
 * Generates the next order number for today by counting today's orders.
 * Wrapped in a retry loop at the call site (unique constraint on
 * orderNumber) so concurrent checkouts can never collide.
 */
export async function nextOrderNumber(date = new Date()): Promise<string> {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  const countToday = await prisma.order.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } });

  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seq = String(countToday + 1).padStart(6, "0");

  return `${yy}${mm}${dd}-${seq}`;
}
