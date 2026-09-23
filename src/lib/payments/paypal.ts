const PAYPAL_API_BASE = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export function isPaypalConfigured(): boolean {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  return Boolean(clientId && clientSecret);
}

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured.");
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getCredentials();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Unable to authenticate with PayPal.");
  const json = await res.json();
  return json.access_token;
}

/** Creates a PayPal Order. Amount is a decimal string (major units) per PayPal's API contract. */
export async function createPaypalOrder(params: {
  amountMajorUnits: string;
  currency?: "INR" | "USD";
  orderId: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const accessToken = await getAccessToken();

  // PayPal REST orders API does not support INR under any circumstances.
  // Always charge in USD for cross-border transactions.
  const paypalCurrency = params.currency === "INR" ? "USD" : (params.currency || "USD");

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.orderId,
          amount: { currency_code: paypalCurrency, value: params.amountMajorUnits },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal order creation failed: ${body}`);
  }

  const json = await res.json();
  const approveLink = json.links?.find((l: { rel: string; href: string }) => l.rel === "approve")?.href;
  return { id: json.id as string, approveUrl: approveLink as string };
}

/**
 * Captures a PayPal order. The capture response comes directly from PayPal's
 * server — this is what makes it trustworthy, unlike a raw frontend callback.
 */
export async function capturePaypalOrder(paypalOrderId: string) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal capture failed: ${body}`);
  }

  return res.json();
}

/**
 * Fetches an existing PayPal order to verify its status and captures.
 */
export async function getPaypalOrder(paypalOrderId: string) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal get order failed: ${body}`);
  }

  return res.json();
}

/**
 * PayPal webhook verification requires calling their verify-webhook-signature
 * endpoint (their events aren't self-verifiable via local HMAC like
 * Razorpay/Stripe). Delegates trust to PayPal's own server-side check.
 */
export async function verifyPaypalWebhookSignature(params: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  webhookEvent: unknown;
}): Promise<boolean> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      transmission_id: params.transmissionId,
      transmission_time: params.transmissionTime,
      cert_url: params.certUrl,
      auth_algo: params.authAlgo,
      transmission_sig: params.transmissionSig,
      webhook_id: params.webhookId,
      webhook_event: params.webhookEvent,
    }),
  });

  if (!res.ok) return false;
  const json = await res.json();
  return json.verification_status === "SUCCESS";
}
