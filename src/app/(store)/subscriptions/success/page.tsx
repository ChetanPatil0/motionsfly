import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, CheckCircle2, FileText, ArrowRight, ShieldCheck, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subscription Activated | MotionFly PRO",
  description: "Your MotionFly PRO subscription has been activated successfully.",
};

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  RAZORPAY: "Cards, UPI & NetBanking",
  PAYPAL: "PayPal",
  STRIPE: "Credit / Debit Card (Visa, Mastercard, Amex)",
};

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const user = await getCurrentUser();
  if (!user || !searchParams.order) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: searchParams.order },
    include: {
      items: {
        include: {
          product: true,
          tutorial: true,
        },
      },
      invoice: true,
    },
  });

  if (!order || order.userId !== (user as { id: string }).id) {
    notFound();
  }

  // Find active subscription for user
  const subscription = await prisma.subscription.findFirst({
    where: { userId: (user as { id: string }).id, status: "ACTIVE" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const planItem = order.items.find((i) => i.planId);
  const paymentMethodLabel = PAYMENT_METHOD_NAMES[order.paymentMethod || ""] || order.paymentMethod || "Online Payment";

  return (
    <div className="container max-w-3xl py-12 sm:py-16">
      <div className="space-y-8 text-center">
        {/* Success Icon & Distinct PRO Activation Header */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/20">
          <Crown className="h-8 w-8 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            PRO Membership Activated
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground">
            Welcome to MotionFly PRO!
          </h1>
          <p className="mx-auto max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
            Your subscription has been confirmed and is now active. All premium video masterclasses, project files, and creative plugins are unlocked at zero extra cost.
          </p>
        </div>

        {/* Subscription Receipt Summary Card */}
        <Card className="border-amber-500/40 shadow-xl bg-card text-left overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-border/40 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Subscription Receipt
                </CardTitle>
                <CardDescription className="text-xs">
                  Order #{order.orderNumber} {order.invoice && `• Invoice ${order.invoice.invoiceNumber}`}
                </CardDescription>
              </div>
              <Badge className="w-fit bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold text-xs">
                Payment Completed
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div>
                <span className="text-xs text-muted-foreground">Membership Plan</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {planItem?.itemTitle || subscription?.plan?.name || "MotionFly PRO"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Billing Method</span>
                <p className="font-semibold text-foreground mt-0.5">{paymentMethodLabel}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Amount Paid</span>
                <p className="font-mono text-base font-bold text-foreground mt-0.5">
                  {formatMoney(order.total, order.currency)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Billing Period / Renewal</span>
                <p className="font-medium text-foreground mt-0.5">
                  {subscription
                    ? `Active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : "Active"}
                </p>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {order.invoice && (
                  <>
                    <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-medium">
                      <Link href={`/invoices/${order.invoice.id}`} target="_blank">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        View Official Receipt
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs">
                      <Link href={`/invoices/${order.invoice.id}?autoPrint=1`} target="_blank">
                        <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                        Print
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Zero-risk guarantee • Cancel anytime</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            size="lg"
            asChild
            className="w-full sm:w-auto gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black font-bold shadow-md"
          >
            <Link href="/products">
              Explore All PRO Assets <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
            <Link href="/account/subscription">Manage Subscription</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
