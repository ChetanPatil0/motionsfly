import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { getResolvedCart, addToCart, mergeGuestCartIntoUser } from "@/lib/cart";
import { addCartItemSchema } from "@/schemas/cart";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (user) {
    await mergeGuestCartIntoUser((user as { id: string }).id);
  }
  const preferredCurrency = cookies().get("mf_currency_view")?.value as "INR" | "USD" | undefined;
  const countryCode = cookies().get("mf_country")?.value ?? (preferredCurrency === "USD" ? "US" : "IN");
  const cart = await getResolvedCart(user ? (user as { id: string }).id : null, countryCode, preferredCurrency);
  return apiSuccess(cart, "Cart loaded.");
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = addCartItemSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  await addToCart(user ? (user as { id: string }).id : null, parsed.data);

  const preferredCurrency = cookies().get("mf_currency_view")?.value as "INR" | "USD" | undefined;
  const countryCode = cookies().get("mf_country")?.value ?? (preferredCurrency === "USD" ? "US" : "IN");
  const cart = await getResolvedCart(user ? (user as { id: string }).id : null, countryCode, preferredCurrency);
  return apiSuccess(cart, "Added to cart successfully.");
});
