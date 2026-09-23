import { Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { order: { select: { orderNumber: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
      <p className="text-sm text-muted-foreground">Every transaction received across your payment methods (Razorpay, Stripe, or PayPal).</p>

      {payments.length === 0 ? (
        <EmptyState icon={Receipt} title="No Payments Yet" description="Transactions from your payment methods will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Order</th>
                  <th className="p-3 font-medium">Payment Method</th>
                  <th className="p-3 font-medium">Transaction ID</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{p.order.orderNumber}</td>
                    <td className="p-3">{p.provider}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{p.providerPaymentId ?? "—"}</td>
                    <td className="p-3">{formatMoney(p.amount, p.currency)}</td>
                    <td className="p-3">
                      <Badge variant={p.status === "SUCCESS" ? "success" : p.status === "FAILED" ? "destructive" : "secondary"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.createdAt.toLocaleString()}</td>
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
