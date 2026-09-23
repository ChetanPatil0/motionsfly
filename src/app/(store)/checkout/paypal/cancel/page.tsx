"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaypalCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order");

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type: "PAYPAL_ORDER_CANCELLED", orderNumber }, "*");
        setTimeout(() => {
          window.close();
        }, 800);
      } catch {
        // Opener not accessible
      }
    }
  }, [orderNumber]);

  return (
    <div className="container flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <XCircle className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold">Payment Cancelled</h1>
      <p className="text-sm text-muted-foreground">
        You cancelled the PayPal payment. You can return to your checkout page to try again or pick another payment method.
      </p>
      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => {
            if (window.opener) {
              window.close();
            } else {
              router.push("/checkout");
            }
          }}
        >
          Return to Checkout
        </Button>
      </div>
    </div>
  );
}
