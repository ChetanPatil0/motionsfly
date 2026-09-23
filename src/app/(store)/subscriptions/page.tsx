import { CreditCard, Check, Crown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/utils";
import { SubscribeButton } from "@/components/subscribe-button";
import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();
  const cookieStore = cookies();
  const rawCurrency = cookieStore.get("NEXT_CURRENCY")?.value || cookieStore.get("mf_currency_view")?.value;
  const currencyView: "INR" | "USD" =
    rawCurrency === "INR" || rawCurrency === "USD" ? rawCurrency : user?.country === "IN" ? "INR" : "USD";

  const [plans, activeSub] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceINR: "asc" },
    }),
    user
      ? prisma.subscription.findFirst({
          where: {
            userId: user.id,
            status: "ACTIVE",
          },
          include: { plan: true },
        })
      : null,
  ]);

  return (
    <div className="container max-w-4xl py-16">
      <div className="mb-12 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-500 backdrop-blur">
          <Crown className="h-3.5 w-3.5" />
          MotionFly PRO Membership
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Unlock Everything with PRO</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Gain unlimited instant access to every premium masterclass, project file, and digital asset across MotionFly.
        </p>
      </div>

      {activeSub && (
        <div className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/20 p-2.5 text-amber-500">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">You are currently a PRO Member!</p>
              <p className="text-xs text-muted-foreground">
                Active plan: {activeSub.plan.name} &bull; Renews on {new Date(activeSub.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/account/subscription">Manage Subscription</Link>
          </Button>
        </div>
      )}

      {plans.length === 0 ? (
        <EmptyState icon={CreditCard} title="No Plans Available" description="Subscription plans will appear here once configured." />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {plans.map((plan) => {
            const isYearly = plan.billingInterval === "YEARLY";
            const price = currencyView === "INR" ? plan.priceINR : plan.priceUSD;
            const altPrice = currencyView === "INR" ? plan.priceUSD : plan.priceINR;
            const altCurrency = currencyView === "INR" ? "USD" : "INR";

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isYearly ? "border-amber-500/40 shadow-amber-500/5 ring-1 ring-amber-500/30" : ""
                }`}
              >
                {isYearly && (
                  <div className="absolute right-3 top-3">
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-[11px] gap-1 shadow-sm">
                      <Crown className="h-3 w-3" /> Best Value (2 Months Free)
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-foreground flex items-center gap-2">
                    {plan.name}
                    {isYearly && <Crown className="h-4 w-4 text-amber-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {formatMoney(price, currencyView)}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">
                        / {plan.billingInterval.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      approx. {formatMoney(altPrice, altCurrency)}
                    </p>

                    <div className="border-t pt-4">
                      <ul className="space-y-2.5 text-sm">
                        <li className="flex items-center gap-2 text-foreground">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Unlimited access to all Masterclasses</span>
                        </li>
                        <li className="flex items-center gap-2 text-foreground">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Streaming at full 4K 60fps quality</span>
                        </li>
                        <li className="flex items-center gap-2 text-foreground">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Exclusive project files & assets</span>
                        </li>
                        <li className="flex items-center gap-2 text-foreground">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Cancel or switch plans anytime</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2">
                    {activeSub?.planId === plan.id ? (
                      <Button disabled className="w-full" variant="outline">
                        Current Active Plan
                      </Button>
                    ) : (
                      <SubscribeButton planId={plan.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

