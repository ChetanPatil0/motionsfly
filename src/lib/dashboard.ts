import { prisma } from "@/lib/prisma";
import { Currency } from "@prisma/client";

export type DateRangeKey =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom";

export function resolveDateRange(key: DateRangeKey, from?: string, to?: string): { start: Date; end: Date } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (key) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case "last7": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case "last30": {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case "thisMonth":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
    case "lastMonth": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "thisYear":
      return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
    case "custom":
      return {
        start: from ? startOfDay(new Date(from)) : startOfDay(now),
        end: to ? endOfDay(new Date(to)) : endOfDay(now),
      };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

/** Revenue counts only PAID orders — never failed/cancelled/refunded (Section 37/47). */
async function getRevenueByCurrency(start: Date, end: Date) {
  const grouped = await prisma.order.groupBy({
    by: ["currency"],
    where: { status: "PAID", paymentStatus: "SUCCESS", createdAt: { gte: start, lte: end } },
    _sum: { total: true },
  });

  const result: Record<Currency, number> = { INR: 0, USD: 0 };
  for (const row of grouped) {
    result[row.currency] = row._sum.total ?? 0;
  }
  return result;
}

async function getSummaryCounts(start: Date, end: Date) {
  const [orders, customers, downloads, products, tutorials, activeSubscriptions, pendingOrders] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: start, lte: end } } }),
      prisma.download.count({ where: { status: "SUCCESS", createdAt: { gte: start, lte: end } } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.tutorial.count({ where: { deletedAt: null } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
    ]);

  return { orders, customers, downloads, products, tutorials, activeSubscriptions, pendingOrders };
}

/** Revenue-over-time chart, bucketed per day, DB-aggregated (Section 38/52). */
async function getRevenueSeries(start: Date, end: Date) {
  const rows = await prisma.$queryRaw<{ day: Date; currency: Currency; total: bigint }[]>`
    SELECT date_trunc('day', "createdAt") as day, currency, SUM(total) as total
    FROM orders
    WHERE status = 'PAID' AND "paymentStatus" = 'SUCCESS'
      AND "createdAt" >= ${start} AND "createdAt" <= ${end}
    GROUP BY day, currency
    ORDER BY day ASC
  `;
  return rows.map((r) => ({ date: r.day.toISOString(), currency: r.currency, total: Number(r.total) }));
}

async function getOrdersSeries(start: Date, end: Date) {
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', "createdAt") as day, COUNT(*) as count
    FROM orders
    WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({ date: r.day.toISOString(), count: Number(r.count) }));
}

/** Top-selling products via GROUP BY on order_items — never loads full orders (Section 40). */
async function getTopProducts(start: Date, end: Date, limit = 5) {
  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: { status: "PAID", paymentStatus: "SUCCESS", createdAt: { gte: start, lte: end } },
    },
    _sum: { quantity: true, price: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const productIds = rows.map((r) => r.productId).filter((id): id is string => !!id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true },
  });
  const titleMap = new Map(products.map((p) => [p.id, p.title]));

  return rows.map((r) => ({
    productId: r.productId,
    title: r.productId ? titleMap.get(r.productId) ?? "Unknown Product" : "Unknown Product",
    unitsSold: r._sum.quantity ?? 0,
    revenue: r._sum.price ?? 0,
  }));
}

async function getSubscriptionStats(start: Date, end: Date) {
  const [active, newSubs, cancelled, monthlyRevenue, yearlyRevenue] = await Promise.all([
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.subscription.count({ where: { status: "CANCELLED", updatedAt: { gte: start, lte: end } } }),
    prisma.subscriptionPayment.aggregate({
      where: { status: "SUCCESS", subscription: { plan: { billingInterval: "MONTHLY" } }, createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.subscriptionPayment.aggregate({
      where: { status: "SUCCESS", subscription: { plan: { billingInterval: "YEARLY" } }, createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  return {
    active,
    newSubscriptions: newSubs,
    cancelled,
    monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    yearlyRevenue: yearlyRevenue._sum.amount ?? 0,
  };
}

async function getRecentOrders(limit = 10) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { itemTitle: true }, take: 1 },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.user?.name ?? o.guestEmail ?? "Guest",
    productSummary: o.items[0]?.itemTitle ?? "—",
    total: o.total,
    currency: o.currency,
    paymentStatus: o.paymentStatus,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getDashboardData(range: { start: Date; end: Date }) {
  const [revenue, summary, revenueSeries, ordersSeries, topProducts, subscriptions, recentOrders] =
    await Promise.all([
      getRevenueByCurrency(range.start, range.end),
      getSummaryCounts(range.start, range.end),
      getRevenueSeries(range.start, range.end),
      getOrdersSeries(range.start, range.end),
      getTopProducts(range.start, range.end),
      getSubscriptionStats(range.start, range.end),
      getRecentOrders(10),
    ]);

  return {
    summary: { revenue, ...summary },
    revenueSeries,
    ordersSeries,
    topProducts,
    subscriptions,
    recentOrders,
  };
}
