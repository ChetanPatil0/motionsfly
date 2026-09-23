import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { getResolvedCart } from "@/lib/cart";
import { validateAndComputeCoupon } from "@/lib/coupon";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const schema = z.object({ code: z.string().trim().min(1) });

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const user = await getCurrentUser();
  const countryCode = cookies().get("mf_country")?.value ?? "IN";
  const cart = await getResolvedCart(user ? (user as { id: string }).id : null, countryCode);

  const result = await validateAndComputeCoupon(parsed.data.code, cart.subtotal, user ? (user as { id: string }).id : null);

  if (!result.valid) return apiError(result.message, [], 400);

  return apiSuccess(
    { discount: result.discount, subtotal: cart.subtotal, total: cart.subtotal - result.discount, currency: cart.currency },
    "Coupon applied successfully."
  );
});
