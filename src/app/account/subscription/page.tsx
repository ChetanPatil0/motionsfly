import Link from "next/link";
import { CreditCard, Crown, FileText, CheckCircle2, ShieldAlert, Calendar, DollarSign, ExternalLink, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { SubscriptionExpiryBanner } from "@/components/subscription-expiry-banner";
import { CancelSubscriptionButton } from "@/components/cancel-subscription-button";

export const dynamic = "force-dynamic";

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  RAZORPAY: "Cards, UPI & NetBanking",
  PAYPAL: "PayPal",
  STRIPE: "Credit / Debit Card (Visa, Mastercard, Amex)",
};

export default async function AccountSubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const userId = (user as { id: string }).id;

  const [subscriptions, invoices] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        userId,
        order: {
          items: {
            some: {
              planId: { not: null },
            },
          },
        },
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const active = subscriptions.find((s) => s.status === "ACTIVE");

  const daysUntilExpiry = active
    ? Math.ceil((active.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Match active subscription with its latest invoice
  const activeInvoice = invoices[0];
  const latestPayment = active?.payments[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">PRO Membership &amp; Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your active membership plan, view billing payment details, and access official subscription receipts.
        </p>
      </div>

      {active && daysUntilExpiry !== null && daysUntilExpiry <= 10 && (
        <SubscriptionExpiryBanner daysLeft={daysUntilExpiry} cancelling={active.cancelAtPeriodEnd} />
      )}

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Active Subscription"
          description="Subscribe to MotionFly PRO to unlock every premium masterclass, project file, and digital asset."
          actionLabel="View PRO Plans"
          actionHref="/subscriptions"
        />
      ) : (
        <div className="space-y-6">
          {/* Active Plan Card with Comprehensive Payment Details */}
          {active && (
            <Card className="border-amber-500/40 shadow-sm overflow-hidden bg-card">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-border/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-black uppercase tracking-wider">
                        <Crown className="h-3 w-3" /> ACTIVE PRO
                      </span>
                      <Badge variant="success" className="text-xs">
                        {active.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground mt-1">
                      {active.plan.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {active.plan.description || "Unlimited access to all creative assets and masterclasses."}
                    </CardDescription>
                  </div>

                  {activeInvoice && (
                    <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-medium w-fit">
                      <Link href={`/invoices/${activeInvoice.id}`} target="_blank">
                        <FileText className="h-3.5 w-3.5 text-amber-500" />
                        View Subscription Receipt
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Payment & Billing Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-sm">
                  {/* Payment Method */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-primary" /> Payment Method
                    </span>
                    <p className="font-semibold text-foreground">
                      {PAYMENT_METHOD_NAMES[active.provider] || active.provider}
                    </p>
                  </div>

                  {/* Pricing Rate */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Billing Rate
                    </span>
                    <p className="font-semibold text-foreground">
                      {formatMoney(
                        active.currency === "INR" ? active.plan.priceINR : active.plan.priceUSD,
                        active.currency
                      )}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        / {active.plan.billingInterval.toLowerCase()}
                      </span>
                    </p>
                  </div>

                  {/* Billing Frequency */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Billing Frequency</span>
                    <p className="font-semibold text-foreground capitalize">
                      {active.plan.billingInterval.toLowerCase()} Billing
                    </p>
                  </div>

                  {/* Current Period Start */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Started On
                    </span>
                    <p className="font-medium text-foreground">
                      {new Date(active.currentPeriodStart).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Renewal Date */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      {active.cancelAtPeriodEnd ? "Access Until" : "Next Renewal Date"}
                    </span>
                    <p className="font-semibold text-foreground">
                      {new Date(active.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Transaction ID</span>
                    <p className="font-mono text-xs text-muted-foreground truncate" title={latestPayment?.providerPaymentId || active.providerSubscriptionId || active.id}>
                      {latestPayment?.providerPaymentId || active.providerSubscriptionId || active.id.slice(0, 18)}
                    </p>
                  </div>
                </div>

                {/* Status Notice & Cancellation */}
                <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {active.cancelAtPeriodEnd ? (
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>
                        Your subscription has been cancelled and will not renew. You retain full access until{" "}
                        <strong>{new Date(active.currentPeriodEnd).toLocaleDateString()}</strong>.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Automatic renewals enabled. Cancel anytime with no penalties.</span>
                    </div>
                  )}

                  {!active.cancelAtPeriodEnd && (
                    <div className="shrink-0">
                      <CancelSubscriptionButton subscriptionId={active.id} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription History & Receipts Section */}
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">Subscription Payment History &amp; Receipts</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed record of all subscription cycles, payments, and downloadable invoices.
              </p>
            </div>

            {invoices.length === 0 && subscriptions.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed text-center text-sm text-muted-foreground">
                No past billing records found.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-muted-foreground text-xs">
                    <tr>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Plan / Item</th>
                      <th className="p-3 font-medium">Payment Method</th>
                      <th className="p-3 font-medium">Amount</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {/* Render Invoices corresponding to subscriptions */}
                    {invoices.map((inv) => {
                      const planItem = inv.order.items.find((i) => i.planId);
                      return (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 text-xs text-muted-foreground">
                            {new Date(inv.issuedAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground">
                              {planItem?.itemTitle || "MotionFly PRO Membership"}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {PAYMENT_METHOD_NAMES[inv.paymentMethod || ""] || inv.paymentMethod || "Online"}
                          </td>
                          <td className="p-3 font-mono font-medium">
                            {formatMoney(inv.total, inv.currency)}
                          </td>
                          <td className="p-3">
                            <Badge variant="success" className="text-[11px]">
                              Paid
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs font-medium gap-1">
                                <Link href={`/invoices/${inv.id}`} target="_blank">
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                  <span>View Receipt</span>
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground" title="Print Receipt">
                                <Link href={`/invoices/${inv.id}?autoPrint=1`} target="_blank">
                                  <Printer className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Also list any past subscriptions not captured in invoices */}
                    {subscriptions.filter((s) => s.status !== "ACTIVE").map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-semibold text-foreground">
                          {s.plan.name}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {PAYMENT_METHOD_NAMES[s.provider] || s.provider}
                        </td>
                        <td className="p-3 font-mono font-medium">
                          {formatMoney(
                            s.currency === "INR" ? s.plan.priceINR : s.plan.priceUSD,
                            s.currency
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[11px]">
                            {s.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right text-xs text-muted-foreground">
                          Archived
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

