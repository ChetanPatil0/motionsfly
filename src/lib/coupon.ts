import { prisma } from "@/lib/prisma";

export type CouponValidationResult =
  | { valid: true; couponId: string; discount: number }
  | { valid: false; message: string };

/** Computes and validates a coupon discount entirely server-side against the real subtotal. */
export async function validateAndComputeCoupon(code: string, subtotal: number, userId: string | null): Promise<CouponValidationResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.isActive) return { valid: false, message: "This coupon code is invalid." };

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    return { valid: false, message: "This coupon has expired or is not yet active." };
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return { valid: false, message: "Your order does not meet the minimum amount for this coupon." };
  }

  if (coupon.usageLimit) {
    const usageCount = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
    if (usageCount >= coupon.usageLimit) {
      return { valid: false, message: "This coupon has reached its usage limit." };
    }
  }

  if (userId) {
    const alreadyUsed = await prisma.couponUsage.findFirst({ where: { couponId: coupon.id, userId } });
    if (alreadyUsed) return { valid: false, message: "You have already used this coupon." };
  }

  const rawDiscount =
    coupon.discountType === "PERCENTAGE"
      ? Math.floor((subtotal * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, subtotal);

  // A coupon must never fully zero out an order that actually costs
  // something — that would incorrectly get treated as a free product
  // checkout downstream (which skips payment entirely). Cap the discount
  // so at least the smallest unit of the currency is still charged.
  const discount = subtotal > 0 ? Math.min(rawDiscount, subtotal - 1) : rawDiscount;

  return { valid: true, couponId: coupon.id, discount };
}
