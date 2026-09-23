import { prisma } from "@/lib/prisma";
import { resolveCurrencyFromCountry, priceForCurrency } from "@/lib/currency";
import { getGuestCart, setGuestCart, type GuestCartItem } from "@/lib/guest-cart";
import type { Currency } from "@prisma/client";

export type ResolvedCartLine = {
  id: string; // cartItemId (DB) or synthetic key (guest)
  type: "PRODUCT" | "TUTORIAL" | "SUBSCRIPTION_PLAN";
  refId: string;
  title: string;
  thumbnail: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type ResolvedCart = {
  currency: Currency;
  lines: ResolvedCartLine[];
  subtotal: number;
};

async function resolveLines(
  rawItems: { type: string; productId?: string | null; tutorialId?: string | null; planId?: string | null; quantity: number; id?: string }[],
  currency: Currency
): Promise<ResolvedCartLine[]> {
  const productIds = rawItems.filter((i) => i.type === "PRODUCT" && i.productId).map((i) => i.productId!);
  const tutorialIds = rawItems.filter((i) => i.type === "TUTORIAL" && i.tutorialId).map((i) => i.tutorialId!);
  const planIds = rawItems.filter((i) => i.type === "SUBSCRIPTION_PLAN" && i.planId).map((i) => i.planId!);

  const [products, tutorials, plans] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds }, deletedAt: null, isPublished: true } })
      : Promise.resolve([]),
    tutorialIds.length
      ? prisma.tutorial.findMany({ where: { id: { in: tutorialIds }, deletedAt: null, isPublished: true } })
      : Promise.resolve([]),
    planIds.length
      ? prisma.subscriptionPlan.findMany({ where: { id: { in: planIds }, isActive: true } })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const tutorialMap = new Map(tutorials.map((t) => [t.id, t]));
  const planMap = new Map(plans.map((p) => [p.id, p]));

  const lines: ResolvedCartLine[] = [];

  for (const item of rawItems) {
    if (item.type === "PRODUCT" && item.productId) {
      const p = productMap.get(item.productId);
      if (!p) continue;
      const unitPrice = p.isFree ? 0 : priceForCurrency(p, currency);
      lines.push({
        id: item.id ?? `guest-product-${p.id}`,
        type: "PRODUCT",
        refId: p.id,
        title: p.title,
        thumbnail: p.thumbnail,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      });
    } else if (item.type === "TUTORIAL" && item.tutorialId) {
      const t = tutorialMap.get(item.tutorialId);
      if (!t) continue;
      const unitPrice = t.accessType === "FREE" ? 0 : priceForCurrency(t, currency);
      lines.push({
        id: item.id ?? `guest-tutorial-${t.id}`,
        type: "TUTORIAL",
        refId: t.id,
        title: t.title,
        thumbnail: t.thumbnail,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      });
    } else if (item.type === "SUBSCRIPTION_PLAN" && item.planId) {
      const plan = planMap.get(item.planId);
      if (!plan) continue;
      const unitPrice = priceForCurrency(plan, currency);
      lines.push({
        id: item.id ?? `guest-plan-${plan.id}`,
        type: "SUBSCRIPTION_PLAN",
        refId: plan.id,
        title: `${plan.name} (${plan.billingInterval})`,
        thumbnail: null,
        unitPrice,
        quantity: 1,
        lineTotal: unitPrice,
      });
    }
  }

  return lines;
}

export async function getResolvedCart(
  userId: string | null,
  countryCode: string,
  preferredCurrency?: Currency
): Promise<ResolvedCart> {
  const currency = preferredCurrency ?? resolveCurrencyFromCountry(countryCode);

  if (userId) {
    const cart = await prisma.cart.findUnique({ where: { userId }, include: { items: true } });
    const lines = await resolveLines(cart?.items ?? [], currency);
    return { currency, lines, subtotal: lines.reduce((s, l) => s + l.lineTotal, 0) };
  }

  const guestItems = getGuestCart();
  const lines = await resolveLines(guestItems, currency);
  return { currency, lines, subtotal: lines.reduce((s, l) => s + l.lineTotal, 0) };
}

export async function addToCart(
  userId: string | null,
  item: { type: "PRODUCT" | "TUTORIAL" | "SUBSCRIPTION_PLAN"; productId?: string; tutorialId?: string; planId?: string; quantity: number }
) {
  if (userId) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        type: item.type,
        productId: item.productId ?? null,
        tutorialId: item.tutorialId ?? null,
        planId: item.planId ?? null,
      },
    });

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          type: item.type,
          productId: item.productId ?? null,
          tutorialId: item.tutorialId ?? null,
          planId: item.planId ?? null,
          quantity: item.quantity,
        },
      });
    }
    return;
  }

  const guestItems = getGuestCart();
  const existingIndex = guestItems.findIndex(
    (g) => g.type === item.type && g.productId === item.productId && g.tutorialId === item.tutorialId && g.planId === item.planId
  );
  if (existingIndex >= 0) {
    guestItems[existingIndex]!.quantity += item.quantity;
  } else {
    guestItems.push(item as GuestCartItem);
  }
  setGuestCart(guestItems);
}

export async function removeFromCart(userId: string | null, lineId: string) {
  if (userId) {
    await prisma.cartItem.deleteMany({ where: { id: lineId, cart: { userId } } });
    return;
  }
  const guestItems = getGuestCart().filter(
    (g) => `guest-product-${g.productId}` !== lineId && `guest-tutorial-${g.tutorialId}` !== lineId && `guest-plan-${g.planId}` !== lineId
  );
  setGuestCart(guestItems);
}

/** Merges a guest's cookie cart into their DB cart right after login (Section 64-style sync, applied to cart). */
export async function mergeGuestCartIntoUser(userId: string) {
  const guestItems = getGuestCart();
  if (guestItems.length === 0) return;

  for (const item of guestItems) {
    await addToCart(userId, item);
  }
  setGuestCart([]);
}
