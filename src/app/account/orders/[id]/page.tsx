import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Printer, CheckCircle2, Clock, XCircle, RotateCcw, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; className: string; description: string }
> = {
  PAID: {
    label: "Paid & Fulfilled",
    icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    description: "Your payment has been received and verified. All access tokens and invoices are unlocked.",
  },
  PENDING: {
    label: "Payment Pending",
    icon: Clock,
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    description: "This order is awaiting payment processing or gateway confirmation.",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    description: "This order was cancelled and no charges were made.",
  },
  REFUNDED: {
    label: "Refunded",
    icon: RotateCcw,
    className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    description: "A full refund has been issued back to your original payment method.",
  },
  FAILED: {
    label: "Payment Failed",
    icon: AlertCircle,
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    description: "The payment transaction could not be processed by the bank or payment gateway.",
  },
};

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  RAZORPAY: "Cards, UPI & NetBanking",
  PAYPAL: "PayPal",
  STRIPE: "Credit / Debit Card (Visa, Mastercard, Amex)",
};

export default async function AccountOrderDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, invoice: true },
  });

  if (!order || order.userId !== (user as { id: string }).id) notFound();

  const statusConfig = STATUS_CONFIG[order.status] || {
    label: order.status,
    icon: AlertCircle,
    className: "bg-muted text-muted-foreground",
    description: "",
  };
  const StatusIcon = statusConfig.icon;
  const paymentMethodLabel = PAYMENT_METHOD_NAMES[order.paymentMethod || ""] || order.paymentMethod || "Online Payment";

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to All Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <div>
          <span className="text-xs text-muted-foreground font-mono">Order Reference</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Placed on {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <Badge className={`gap-1.5 font-semibold text-xs py-1 px-3 w-fit ${statusConfig.className}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          <span>{statusConfig.label}</span>
        </Badge>
      </div>

      {statusConfig.description && (
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground">
          {statusConfig.description}
        </div>
      )}

      {/* Items Ordered */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Items in this Order</CardTitle>
          <CardDescription>All products, tutorials, or subscription plans purchased.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="divide-y divide-border/40">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{item.itemTitle}</p>
                  <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                </div>
                <span className="font-mono font-medium">
                  {formatMoney(item.price * item.quantity, item.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{formatMoney(order.subtotal, order.currency)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount / Promo</span>
                <span className="font-mono">-{formatMoney(order.discount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t">
              <span>Total Paid</span>
              <span className="font-mono text-base">{formatMoney(order.total, order.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice & Payment Information */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Payment &amp; Invoice</CardTitle>
            <CardDescription>Billing method and official receipt access.</CardDescription>
          </div>
          {order.invoice && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild className="gap-1 text-xs">
                <Link href={`/invoices/${order.invoice.id}`} target="_blank">
                  <FileText className="h-3.5 w-3.5 text-primary" /> View Receipt
                </Link>
              </Button>
              <Button size="icon" variant="ghost" asChild className="h-8 w-8 text-muted-foreground">
                <Link href={`/invoices/${order.invoice.id}?autoPrint=1`} target="_blank" title="Print Invoice">
                  <Printer className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Payment Method</span>
              <p className="font-semibold text-foreground mt-0.5">{paymentMethodLabel}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Payment Status</span>
              <p className="font-semibold text-foreground mt-0.5 capitalize">{order.paymentStatus.toLowerCase()}</p>
            </div>
            {order.invoice && (
              <>
                <div>
                  <span className="text-xs text-muted-foreground">Invoice Number</span>
                  <p className="font-mono text-xs font-semibold text-foreground mt-0.5">{order.invoice.invoiceNumber}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Billed To</span>
                  <p className="text-xs font-medium text-foreground mt-0.5">{order.invoice.billingName}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

