import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { SubscriptionsSubNav } from "@/components/admin/subscriptions-sub-nav";
import { formatMoney } from "@/lib/utils";

export default async function AdminUserSubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } }, plan: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
      <SubscriptionsSubNav />

      {subscriptions.length === 0 ? (
        <EmptyState icon={Users} title="No Subscriptions Yet" description="Subscribed users will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3 font-medium">Provider</th>
                  <th className="p-3 font-medium">Currency</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Renews</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">
                      <Link href={`/admin/users/${s.user.id}`} className="font-medium hover:underline">
                        {s.user.name}
                      </Link>
                    </td>
                    <td className="p-3">{s.plan.name}</td>
                    <td className="p-3 text-muted-foreground">{s.provider}</td>
                    <td className="p-3">{s.currency}</td>
                    <td className="p-3">
                      <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"}>{s.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{s.currentPeriodEnd.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
