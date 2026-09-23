import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { BackLink } from "@/components/back-link";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 10 },
      downloads: { include: { product: { select: { title: true } } }, take: 10 },
      wishlist: { include: { items: { include: { product: { select: { title: true } } } } } },
      reviews: { include: { product: { select: { title: true } } } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) notFound();

  const activeSubscription = user.subscriptions.find((s) => s.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <BackLink href="/admin/users" label="Back to Users" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSubscription ? (
              <div className="space-y-2 text-sm">
                <Row label="Plan" value={activeSubscription.plan.name} />
                <Row label="Status" value={<Badge variant="success">{activeSubscription.status}</Badge>} />
                <Row label="Provider" value={activeSubscription.provider} />
                <Row label="Currency" value={activeSubscription.currency} />
                <Row label="Start Date" value={activeSubscription.startDate.toLocaleDateString()} />
                <Row label="Next Renewal" value={activeSubscription.currentPeriodEnd.toLocaleDateString()} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active subscription.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">Account Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Orders" value={user.orders.length} />
            <Row label="Downloads" value={user.downloads.length} />
            <Row label="Wishlist Items" value={user.wishlist?.items.length ?? 0} />
            <Row label="Reviews" value={user.reviews.length} />
            <Row label="Joined" value={user.createdAt.toLocaleDateString()} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Subscription History</CardTitle>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscription history.</p>
          ) : (
            <ul className="divide-y">
              {user.subscriptions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{s.plan.name}</span>
                  <span className="text-muted-foreground">{s.provider}</span>
                  <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"}>{s.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {user.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y">
              {user.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-xs">{o.orderNumber}</span>
                  <span>{formatMoney(o.total, o.currency)}</span>
                  <Badge variant={o.status === "PAID" ? "success" : "secondary"}>{o.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
