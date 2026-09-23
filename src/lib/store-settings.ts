import { prisma } from "@/lib/prisma";

export async function getStoreSettings() {
  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return settings;
}

/**
 * Both Razorpay and PayPal are offered to every customer regardless of
 * their currency — this only checks whether the admin has the provider
 * turned on at all. Currency itself is handled dynamically by each
 * provider's order-creation call (see lib/payments/*), not gated here.
 */
export function isProviderEnabled(
  provider: "RAZORPAY" | "STRIPE" | "PAYPAL",
  settings: { razorpayEnabled: boolean; stripeEnabled: boolean; paypalEnabled: boolean }
): boolean {
  if (provider === "RAZORPAY") return settings.razorpayEnabled;
  if (provider === "PAYPAL") return settings.paypalEnabled;
  return settings.stripeEnabled;
}
