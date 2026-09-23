import crypto from "crypto";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

function getSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("Stripe is not configured.");
  return key;
}

function toFormBody(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/** Creates a Stripe Checkout Session (redirect flow — simplest correct integration without Stripe Elements). */
export async function createStripeCheckoutSession(params: {
  amount: number; // minor units (cents or paise)
  currency: string;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
}) {
  const secretKey = getSecretKey();

  const body = toFormBody({
    mode: "payment",
    "line_items[0][price_data][currency]": params.currency,
    "line_items[0][price_data][product_data][name]": `MotionFly Order`,
    "line_items[0][price_data][unit_amount]": String(params.amount),
    "line_items[0][quantity]": "1",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    "metadata[orderId]": params.orderId,
  });

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Stripe checkout session creation failed: ${errBody}`);
  }

  return res.json() as Promise<{ id: string; url: string }>;
}

/** Verifies a Stripe webhook signature (Stripe-Signature header) without the stripe-node SDK. */
export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("Stripe webhook secret is not configured.");

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    })
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
