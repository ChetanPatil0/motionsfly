"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaypalCapturePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const hasCapturedRef = useRef(false);

  useEffect(() => {
    const orderNumber = searchParams.get("order");
    const paypalOrderId = searchParams.get("token"); // PayPal appends its order id as `token`

    if (!orderNumber || !paypalOrderId) {
      setError("Missing payment reference.");
      return;
    }

    if (hasCapturedRef.current) return;
    hasCapturedRef.current = true;

    fetch("/api/payments/paypal/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, paypalOrderId }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setError(json.message ?? "Payment could not be confirmed.");
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage(
                { type: "PAYPAL_ORDER_FAILED", orderNumber, message: json.message ?? "Payment could not be confirmed." },
                "*"
              );
            } catch {}
          }
          return;
        }

        setIsSuccess(true);

        const isSub = searchParams.get("sub") === "1";
        const successUrl = isSub
          ? `/subscriptions/success?order=${orderNumber}`
          : `/checkout/success?order=${orderNumber}`;

        // If running in a popup modal, notify the opener window and auto-close
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({ type: "PAYPAL_ORDER_SUCCESS", orderNumber, successUrl }, "*");
            setTimeout(() => {
              window.close();
            }, 600);
            return;
          } catch {
            // Opener inaccessible
          }
        }

        router.push(successUrl);
      })
      .catch(() => setError("Payment could not be confirmed."));
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="container flex flex-col items-center gap-3 py-24 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Payment confirmation failed</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => router.push("/checkout")}>Back to Checkout</Button>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center gap-3 py-24 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Confirming your PayPal payment...</p>
    </div>
  );
}
