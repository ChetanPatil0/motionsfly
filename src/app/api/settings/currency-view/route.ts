import { z } from "zod";
import { cookies } from "next/headers";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const schema = z.object({ currency: z.enum(["INR", "USD"]) });

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  // This cookie only ever affects how prices are DISPLAYED on listing/detail
  // pages. It is never read by checkout/order creation — that logic always
  // derives the real transaction currency server-side from country, per
  // Section 28 ("Country/currency selection must be validated server-side").
  cookies().set("mf_currency_view", parsed.data.currency, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  cookies().set("mf_country", parsed.data.currency === "INR" ? "IN" : "US", {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return apiSuccess(null, "Currency view updated.");
});
