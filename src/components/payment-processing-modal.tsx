"use client";

import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PaymentModalStatus = "PROCESSING" | "CONFIRMING" | "SUCCESS" | "FAILED" | "PENDING";

interface PaymentProcessingModalProps {
  isOpen: boolean;
  status: PaymentModalStatus;
  orderNumber?: string;
  approveUrl?: string;
  errorMessage?: string;
  onClose: () => void;
  onRetry: () => void;
}

export function PaymentProcessingModal({
  isOpen,
  status,
  orderNumber = "",
  errorMessage,
  onClose,
  onRetry,
}: PaymentProcessingModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-2xl border bg-card p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-150">
        {status !== "SUCCESS" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <span className="sr-only">Close</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* State 1 & 2: PROCESSING / CONFIRMING */}
        {(status === "PROCESSING" || status === "CONFIRMING") && (
          <div className="space-y-5">
            {/* Elegant Clean Loader */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h3 id="payment-modal-title" className="text-lg font-semibold tracking-tight text-foreground">
                {status === "PROCESSING" ? "Processing Payment" : "Confirming Payment..."}
              </h3>
              <p className="text-sm text-muted-foreground leading-normal">
                {status === "PROCESSING"
                  ? "Finalizing your transaction securely. Please complete checkout in the payment window."
                  : "Payment received. Verifying your order and unlocking your files."}
              </p>
            </div>

            {/* Prominent Security Notice */}
            <div className="rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground border flex items-center gap-2.5 text-left">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <p className="leading-snug">
                <span className="font-semibold text-foreground block">Processing transaction</span>
                Order <span className="font-mono font-medium">#{orderNumber}</span> is awaiting provider confirmation.
              </p>
            </div>

            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel and return to checkout
              </Button>
            </div>
          </div>
        )}

        {/* State 3: SUCCESS */}
        {status === "SUCCESS" && (
          <div className="space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7 animate-in zoom-in duration-200" />
            </div>

            <div className="space-y-1.5">
              <h3 id="payment-modal-title" className="text-lg font-semibold tracking-tight text-foreground">
                Payment Successful!
              </h3>
              <p className="text-sm text-muted-foreground leading-normal">
                Order <span className="font-mono font-medium text-foreground">#{orderNumber}</span> has been confirmed. Redirecting to your downloads...
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Preparing your download page...</span>
            </div>
          </div>
        )}

        {/* State 4: FAILED */}
        {status === "FAILED" && (
          <div className="space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 id="payment-modal-title" className="text-lg font-semibold tracking-tight text-destructive">
                Payment Unsuccessful
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {errorMessage || "The transaction could not be completed or was cancelled. No funds were debited."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" onClick={onRetry} className="w-full" size="sm">
                Try Again
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="w-full" size="sm">
                Close
              </Button>
            </div>
          </div>
        )}

        {/* State 5: PENDING */}
        {status === "PENDING" && (
          <div className="space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Clock className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 id="payment-modal-title" className="text-lg font-semibold tracking-tight text-foreground">
                Payment Awaiting Confirmation
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your payment method is processing the authorization. If money was debited, your order will unlock automatically.
              </p>
            </div>

            <div className="pt-2">
              <Button asChild size="sm" className="w-full">
                <Link href={`/checkout/success?order=${orderNumber}`}>View Order Details</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
