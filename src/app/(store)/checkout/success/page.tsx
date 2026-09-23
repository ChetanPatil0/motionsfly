import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, AlertCircle, Clock, Mail, ArrowRight, RefreshCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { OrderSuccessActions } from "@/components/order-success-actions";
import { OrderPendingPoller } from "@/components/order-pending-poller";

export const metadata = { title: "Order Status" };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  const orderNumber = searchParams.order;

  const [order, settings] = await Promise.all([
    orderNumber
      ? prisma.order.findUnique({
          where: { orderNumber },
          include: {
            items: true,
            downloads: {
              include: {
                product: {
                  select: { title: true, slug: true },
                },
              },
            },
            invoice: true,
          },
        })
      : null,
    prisma.storeSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    }),
  ]);

  if (order && order.items.length > 0 && order.items.every((i) => i.planId)) {
    redirect(`/subscriptions/success?order=${order.orderNumber}`);
  }

  const supportEmail = settings?.supportEmail || settings?.storeEmail || "support@motionfly.dev";

  // Case 1: Order not found
  if (!order) {
    return (
      <div className="container flex max-w-lg flex-col items-center gap-4 py-24 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-sm text-muted-foreground">
          We couldn't locate any order details. If you just placed an order, please check your email or contact support.
        </p>
        <div className="flex gap-3 pt-2">
          <Button asChild>
            <Link href="/products">Browse Store</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`mailto:${supportEmail}`}>Contact Support</a>
          </Button>
        </div>
      </div>
    );
  }

  // Case 2: Payment Failed or Cancelled
  if (order.status === "CANCELLED" || order.paymentStatus === "FAILED") {
    return (
      <div className="container flex max-w-lg flex-col items-center gap-4 py-24 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-destructive">Payment Incomplete or Failed</h1>
        <p className="text-sm text-muted-foreground">
          Order <span className="font-mono font-medium text-foreground">#{order.orderNumber}</span> could not be completed.
          No charges were finalized. You can retry your purchase below.
        </p>

        <div className="w-full space-y-2 rounded-xl border bg-card p-4 text-left text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Order Total</span>
            <span className="font-medium text-foreground">{formatMoney(order.total, order.currency)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Status</span>
            <span className="font-medium text-destructive">Failed / Cancelled</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button asChild>
            <Link href="/checkout">Retry Checkout</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`mailto:${supportEmail}`}>Contact Support ({supportEmail})</a>
          </Button>
        </div>
      </div>
    );
  }

  // Case 3: Payment Pending Confirmation
  if (order.status !== "PAID") {
    return (
      <div className="container flex max-w-lg flex-col items-center gap-4 py-24 text-center">
        <div className="rounded-full bg-warning/10 p-3 text-warning">
          <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold">Payment Pending Confirmation</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          We are awaiting confirmation from the payment method for Order{" "}
          <span className="font-mono font-medium text-foreground">#{order.orderNumber}</span>.
          Once confirmed, your download links and receipt will appear here automatically.
        </p>

        <OrderPendingPoller orderNumber={orderNumber} />

        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground w-full max-w-sm mt-4">
          Need urgent help? Reach out directly to our support team at{" "}
          <a href={`mailto:${supportEmail}`} className="font-medium text-foreground underline">
            {supportEmail}
          </a>
        </div>
      </div>
    );
  }

  // Case 4: Payment Confirmed (PAID)
  return (
    <div className="container flex max-w-2xl flex-col items-center gap-6 py-16 text-center">
      <div className="rounded-full bg-success/10 p-3">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Order Confirmed!</h1>
        <p className="text-muted-foreground text-sm">
          Thank you for your purchase. Order <span className="font-mono font-semibold text-foreground">#{order.orderNumber}</span>
        </p>
      </div>

      {/* Direct File Downloads & Official Receipt Actions */}
      <OrderSuccessActions
        orderNumber={order.orderNumber}
        downloads={order.downloads}
        invoice={order.invoice}
      />

      {/* Order Summary with Total Paid Amount */}
      <div className="w-full space-y-3 rounded-xl border bg-card/60 p-5 text-left text-sm shadow-sm">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Order Summary</h3>
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
            Payment Confirmed
          </span>
        </div>

        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span className="text-foreground font-medium">{item.itemTitle}</span>
              <span className="font-mono text-muted-foreground">
                {formatMoney(item.price * item.quantity, item.currency)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 pt-3 border-t text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span className="font-mono">-{formatMoney(order.discount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between items-center rounded-lg bg-primary/10 p-2.5 text-base font-bold text-foreground">
            <span>Total Paid Amount</span>
            <span className="font-mono text-primary text-lg">
              {formatMoney(order.total, order.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Support Contact Box */}
      <div className="w-full rounded-xl border border-primary/20 bg-muted/20 p-4 text-left flex items-start gap-3.5">
        <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0 mt-0.5">
          <Mail className="h-5 w-5" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-semibold text-sm text-foreground">Need help with your purchase or downloads?</p>
          <p className="text-muted-foreground leading-relaxed">
            Our support team is always available to assist you. If you encounter any problems accessing your files or have questions, contact us directly at:
          </p>
          <a
            href={`mailto:${supportEmail}?subject=Support%20Request%20for%20Order%20%23${order.orderNumber}`}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline pt-0.5 text-sm"
          >
            {supportEmail}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {order.userId && (
          <Button asChild variant="outline">
            <Link href="/account/downloads">View All Account Downloads</Link>
          </Button>
        )}
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
