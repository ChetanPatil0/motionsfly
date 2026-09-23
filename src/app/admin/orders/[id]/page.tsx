import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { RefundButton } from "@/components/admin/refund-button";
import { BackLink } from "@/components/back-link";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
      payments: true,
      invoice: true,
      downloads: { include: { product: { select: { title: true } } } },
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <BackLink href="/admin/orders" label="Back to Orders" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{order.user?.name ?? order.guestEmail ?? "Guest"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={order.status === "PAID" ? "success" : "secondary"}>{order.status}</Badge>
          {order.status === "PAID" && <RefundButton orderId={order.id} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.itemTitle} × {item.quantity}</span>
              <span>{formatMoney(item.price * item.quantity, item.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Discount</span>
              <span>-{formatMoney(order.discount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </CardContent>
      </Card>

      {order.invoice && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-foreground">Invoice</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <a href={`/api/invoices/${order.invoice.id}/download`} download>
                <Download className="h-4 w-4" /> Download
              </a>
            </Button>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {order.invoice.invoiceNumber} &middot; issued {order.invoice.issuedAt.toLocaleDateString()}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Downloads Issued</CardTitle>
        </CardHeader>
        <CardContent>
          {order.downloads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No downloads issued for this order.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {order.downloads.map((d) => (
                <li key={d.id} className="flex justify-between">
                  <span>{d.product.title}</span>
                  <Badge variant={d.status === "SUCCESS" ? "success" : "secondary"}>{d.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
