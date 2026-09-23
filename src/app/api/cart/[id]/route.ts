import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { removeFromCart, getResolvedCart } from "@/lib/cart";
import { apiSuccess, withErrorHandling } from "@/lib/api-response";

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  await removeFromCart(user ? (user as { id: string }).id : null, params.id);

  const preferredCurrency = cookies().get("mf_currency_view")?.value as "INR" | "USD" | undefined;
  const countryCode = cookies().get("mf_country")?.value ?? (preferredCurrency === "USD" ? "US" : "IN");
  const cart = await getResolvedCart(user ? (user as { id: string }).id : null, countryCode, preferredCurrency);
  return apiSuccess(cart, "Item removed from cart.");
});
