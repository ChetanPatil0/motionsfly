import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { mergeGuestCartIntoUser, getResolvedCart } from "@/lib/cart";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return apiError("You must be logged in to merge your cart.", [], 401);

  await mergeGuestCartIntoUser((user as { id: string }).id);

  const countryCode = cookies().get("mf_country")?.value ?? "IN";
  const cart = await getResolvedCart((user as { id: string }).id, countryCode);
  return apiSuccess(cart, "Guest cart merged successfully.");
});
