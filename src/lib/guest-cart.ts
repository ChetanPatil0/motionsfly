import { cookies } from "next/headers";

export type GuestCartItem = {
  type: "PRODUCT" | "TUTORIAL" | "SUBSCRIPTION_PLAN";
  productId?: string;
  tutorialId?: string;
  planId?: string;
  quantity: number;
};

const COOKIE_NAME = "mf_guest_cart";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getGuestCart(): GuestCartItem[] {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setGuestCart(items: GuestCartItem[]) {
  cookies().set(COOKIE_NAME, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export function clearGuestCart() {
  cookies().delete(COOKIE_NAME);
}
