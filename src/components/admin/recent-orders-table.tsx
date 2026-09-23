import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

type RecentOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  productSummary: string;
  total: number;
  currency: "INR" | "USD";
  paymentStatus: string;
  status: string;
  createdAt: string;
};

export function RecentOrdersTable({ data }: { data: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base text-foreground">Recent Orders</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders">View All Orders</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Order #</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Payment</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2 font-mono text-xs">{o.orderNumber}</td>
                    <td className="py-2">{o.customer}</td>
                    <td className="py-2">{o.productSummary}</td>
                    <td className="py-2">{formatMoney(o.total, o.currency)}</td>
                    <td className="py-2">
                      <Badge variant={o.paymentStatus === "SUCCESS" ? "success" : "secondary"}>
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={o.status === "PAID" ? "success" : "secondary"}>{o.status}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{format(new Date(o.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
