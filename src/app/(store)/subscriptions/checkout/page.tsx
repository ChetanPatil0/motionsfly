import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { SubscriptionCheckoutClient } from "@/components/subscription-checkout-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subscription Checkout | MotionFly PRO",
  description: "Activate your MotionFly PRO membership for unlimited access to video assets and masterclasses.",
};

export default async function SubscriptionCheckoutPage({
  searchParams,
}: {
  searchParams: { planId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/subscriptions/checkout${searchParams.planId ? `?planId=${searchParams.planId}` : ""}`)}`);
  }

  // If no planId, redirect to subscriptions page to select a plan
  if (!searchParams.planId) {
    redirect("/subscriptions");
  }

  const [plan, settings, dbUser] = await Promise.all([
    prisma.subscriptionPlan.findUnique({
      where: { id: searchParams.planId, isActive: true },
    }),
    prisma.storeSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    }),
    prisma.user.findUnique({
      where: { id: (user as { id: string }).id },
      select: { id: true, name: true, email: true, country: true },
    }),
  ]);

  if (!plan) {
    redirect("/subscriptions");
  }

  const cookieStore = cookies();
  const currency =
    (cookieStore.get("NEXT_CURRENCY")?.value as "INR" | "USD" | undefined) ||
    (cookieStore.get("mf_currency_view")?.value as "INR" | "USD" | undefined) ||
    (dbUser?.country === "IN" ? "INR" : "USD");

  return (
    <SubscriptionCheckoutClient
      plan={plan}
      user={{
        id: dbUser?.id || (user as { id: string }).id,
        name: dbUser?.name || (user as { name?: string }).name || "",
        email: dbUser?.email || (user as { email?: string }).email || "",
        country: dbUser?.country || "IN",
      }}
      settings={{
        storeActive: settings.storeActive,
        isMaintenance: settings.isMaintenance,
        razorpayEnabled: settings.razorpayEnabled,
        stripeEnabled: settings.stripeEnabled,
        paypalEnabled: settings.paypalEnabled,
        razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()),
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
        paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim()),
        supportEmail: settings.supportEmail,
      }}
      currency={currency}
    />
  );
}
