"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Crown, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Tag, 
  AlertTriangle, 
  Globe, 
  CreditCard 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentProcessingModal, type PaymentModalStatus } from "@/components/payment-processing-modal";
import { COUNTRIES } from "@/constants/countries";
import { formatMoney } from "@/lib/utils";
import { RazorpayIcon, PaypalIcon, StripeIcon, VisaBadge, MastercardBadge, RupayBadge, AmexBadge, UpiBadge, NetbankingBadge } from "@/components/payment-icons";

type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  priceINR: number;
  priceUSD: number;
  billingInterval: "MONTHLY" | "YEARLY";
};

type StoreSetting = {
  storeActive: boolean;
  isMaintenance: boolean;
  razorpayEnabled: boolean;
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  razorpayConfigured?: boolean;
  stripeConfigured?: boolean;
  paypalConfigured?: boolean;
  supportEmail: string | null;
};

const subscriptionFormSchema = z.object({
  billingName: z.string().min(2, "Billing name must be at least 2 characters."),
  billingCountry: z.string().length(2, "Select a valid country."),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  provider: z.enum(["RAZORPAY", "PAYPAL", "STRIPE"] as const),
});

type FormValues = z.infer<typeof subscriptionFormSchema>;

export function SubscriptionCheckoutClient({
  plan,
  user,
  settings,
  currency,
}: {
  plan: SubscriptionPlan;
  user: { id: string; name: string; email: string; country: string };
  settings: StoreSetting;
  currency: "INR" | "USD";
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{ discount: number; finalTotal: number; code: string } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    status: PaymentModalStatus;
    orderNumber?: string;
    approveUrl?: string;
    errorMessage?: string;
  }>({
    isOpen: false,
    status: "PROCESSING",
  });

  const basePrice = currency === "INR" ? plan.priceINR : plan.priceUSD;
  const currentTotal = couponResult ? couponResult.finalTotal : basePrice;

  const razorpayAvailable = !!settings.razorpayEnabled && settings.razorpayConfigured !== false;
  const stripeAvailable = !!settings.stripeEnabled && settings.stripeConfigured !== false;
  const paypalAvailable = !!settings.paypalEnabled && settings.paypalConfigured !== false;

  // Set default provider based on available settings
  const defaultProvider = razorpayAvailable
    ? "RAZORPAY"
    : stripeAvailable
    ? "STRIPE"
    : "PAYPAL";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      billingName: user.name || "",
      billingCountry: user.country || (currency === "INR" ? "IN" : "US"),
      billingAddress: "",
      billingCity: "",
      billingPostalCode: "",
      provider: defaultProvider as any,
    },
  });

  const selectedProvider = watch("provider");

  useEffect(() => {
    if (selectedProvider === "RAZORPAY" && !razorpayAvailable) {
      if (stripeAvailable) setValue("provider", "STRIPE");
      else if (paypalAvailable) setValue("provider", "PAYPAL");
    }
  }, [razorpayAvailable, stripeAvailable, paypalAvailable, selectedProvider, setValue]);

  // PayPal message listener and status polling
  useEffect(() => {
    if (!paymentModalState.isOpen || paymentModalState.status !== "PROCESSING") return;
    const orderNum = paymentModalState.orderNumber;
    if (!orderNum) return;

    let pollCount = 0;
    const maxPollCount = 40; // 40 * 2000ms = 80 seconds timeout

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "PAYPAL_ORDER_SUCCESS") {
        setPaymentModalState((prev) => ({ ...prev, status: "SUCCESS" }));
        setTimeout(() => {
          window.location.href = `/subscriptions/success?order=${encodeURIComponent(e.data.orderNumber || orderNum)}`;
        }, 1200);
      } else if (e.data?.type === "PAYPAL_ORDER_FAILED") {
        setPaymentModalState((prev) => ({
          ...prev,
          status: "FAILED",
          errorMessage: e.data.message || "Payment could not be completed.",
        }));
        setIsSubmitting(false);
      } else if (e.data?.type === "PAYPAL_ORDER_CANCELLED") {
        setPaymentModalState((prev) => ({
          ...prev,
          status: "FAILED",
          errorMessage: "You cancelled the payment in PayPal.",
        }));
        setIsSubmitting(false);
      }
    };

    window.addEventListener("message", handleMessage);

    const pollTimer = setInterval(async () => {
      pollCount += 1;

      // Timeout after 80s
      if (pollCount > maxPollCount) {
        clearInterval(pollTimer);
        setPaymentModalState((prev) => ({
          ...prev,
          status: "FAILED",
          errorMessage: "Subscription payment verification timed out. If your payment was completed, please refresh your account page or contact support.",
        }));
        setIsSubmitting(false);
        return;
      }

      try {
        const res = await fetch(`/api/payments/status?orderNumber=${encodeURIComponent(orderNum)}`);
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.status === "PAID") {
            clearInterval(pollTimer);
            setPaymentModalState((prev) => ({ ...prev, status: "SUCCESS" }));
            setTimeout(() => {
              window.location.href = `/subscriptions/success?order=${encodeURIComponent(orderNum)}`;
            }, 1200);
          } else if (json.data.status === "CANCELLED" || json.data.paymentStatus === "FAILED") {
            clearInterval(pollTimer);
            setPaymentModalState((prev) => ({
              ...prev,
              status: "FAILED",
              errorMessage: "Payment could not be completed or was cancelled.",
            }));
            setIsSubmitting(false);
          }
        }
      } catch {
        // Retry next tick
      }
    }, 2000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(pollTimer);
    };
  }, [paymentModalState.isOpen, paymentModalState.status, paymentModalState.orderNumber]);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal: basePrice }),
      });
      const json = await res.json();
      if (!json.success || !json.data.valid) {
        toast.error(json.message || "Invalid or expired coupon code.");
        setCouponResult(null);
        return;
      }
      setCouponResult({
        discount: json.data.discount,
        finalTotal: Math.max(0, basePrice - json.data.discount),
        code: couponCode.trim().toUpperCase(),
      });
      toast.success("Coupon applied successfully!");
    } catch {
      toast.error("Failed to apply coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  async function onSubmit(values: FormValues) {
    if (!settings.storeActive || settings.isMaintenance) {
      toast.error("Subscription checkout is temporarily paused due to maintenance.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          provider: values.provider,
          billingName: values.billingName,
          billingCountry: values.billingCountry,
          billingAddress: values.billingAddress,
          billingCity: values.billingCity,
          billingPostalCode: values.billingPostalCode,
          couponCode: couponResult?.code,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.message || "Failed to initialize subscription checkout.");
        setIsSubmitting(false);
        return;
      }

      const { order, providerData, isFree } = json.data;

      if (isFree || currentTotal === 0) {
        // Auto-fulfill free promo order
        await fetch("/api/checkout/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, billingName: values.billingName }),
        });
        window.location.href = `/subscriptions/success?order=${order.orderNumber}`;
        return;
      }

      if (values.provider === "RAZORPAY") {
        if (typeof window === "undefined" || !(window as any).Razorpay) {
          toast.error("Razorpay payment gateway failed to load. Please refresh and try again.");
          setIsSubmitting(false);
          return;
        }

        const rzp = new (window as any).Razorpay({
          key: providerData.keyId,
          order_id: providerData.razorpayOrderId,
          amount: order.total,
          currency: order.currency,
          name: "MotionFly PRO Membership",
          description: `Subscription: ${plan.name}`,
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setPaymentModalState((prev) => ({ ...prev, isOpen: false }));
            },
          },
          handler: async (response: any) => {
            setPaymentModalState({
              isOpen: true,
              status: "CONFIRMING",
              orderNumber: order.orderNumber,
              approveUrl: "",
            });
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderNumber: order.orderNumber,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (verifyJson.success) {
              setPaymentModalState((prev) => ({ ...prev, status: "SUCCESS" }));
              setTimeout(() => {
                window.location.href = `/subscriptions/success?order=${encodeURIComponent(order.orderNumber)}`;
              }, 800);
            } else {
              setPaymentModalState((prev) => ({
                ...prev,
                status: "FAILED",
                errorMessage: verifyJson.message ?? "Payment verification failed.",
              }));
              setIsSubmitting(false);
            }
          },
          prefill: { email: user.email, name: values.billingName },
          theme: { color: "#f59e0b" },
        });

        rzp.on("payment.failed", (resp: any) => {
          toast.error(resp.error?.description || "Payment failed.");
          setIsSubmitting(false);
        });

        rzp.open();
        setIsSubmitting(false);
        return;
      }

      if (values.provider === "PAYPAL") {
        setPaymentModalState({
          isOpen: true,
          status: "PROCESSING",
          orderNumber: order.orderNumber,
          approveUrl: providerData.approveUrl,
        });

        const popup = window.open(providerData.approveUrl, "_blank");
        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          window.location.href = providerData.approveUrl;
          return;
        }

        setIsSubmitting(false);
        return;
      }

      if (values.provider === "STRIPE" && providerData?.checkoutUrl) {
        window.location.href = providerData.checkoutUrl;
        return;
      }

      setIsSubmitting(false);
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during subscription checkout.");
      setIsSubmitting(false);
    }
  }

  const isYearly = plan.billingInterval === "YEARLY";

  return (
    <>
      {settings.razorpayEnabled && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      )}

      <PaymentProcessingModal
        isOpen={paymentModalState.isOpen}
        status={paymentModalState.status}
        orderNumber={paymentModalState.orderNumber ?? ""}
        approveUrl={paymentModalState.approveUrl}
        errorMessage={paymentModalState.errorMessage}
        onClose={() => {
          setPaymentModalState((prev) => ({ ...prev, isOpen: false }));
          setIsSubmitting(false);
        }}
        onRetry={() => {
          if (paymentModalState.approveUrl) {
            window.open(paymentModalState.approveUrl, "_blank");
            setPaymentModalState((prev) => ({ ...prev, status: "PROCESSING", errorMessage: undefined }));
          }
        }}
      />

      <div className="container max-w-5xl py-8 sm:py-12">
        {/* Header Breadcrumb / Title */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-500">
            <Crown className="h-3.5 w-3.5" /> PRO Membership Checkout
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Activate Your MotionFly PRO Access
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete your subscription to unlock all premium masterclasses, video project files, and digital resources.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* LEFT COLUMN: Billing Details & Payment Method */}
          <div className="space-y-6">
            {/* Account Confirmation */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span>Subscriber Account</span>
                  <span className="text-xs font-normal text-muted-foreground">Signed In</span>
                </CardTitle>
                <CardDescription>
                  Your subscription will be linked directly to this account for instant access.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-1 bg-muted/30 p-4 rounded-b-xl border-t border-border/40">
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="text-muted-foreground font-mono text-xs">{user.email}</p>
              </CardContent>
            </Card>

            {/* Billing Address Details */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Billing Information</CardTitle>
                <CardDescription>Used to generate your official subscription tax invoice and receipt.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="billingName" className="text-xs font-medium">Full Name / Legal Entity</Label>
                  <Input 
                    id="billingName" 
                    {...register("billingName")} 
                    placeholder="John Doe" 
                    className={errors.billingName ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.billingName && (
                    <p className="text-xs text-destructive font-medium">{errors.billingName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Billing Country / Region</Label>
                  <Controller
                    control={control}
                    name="billingCountry"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.billingCountry && (
                    <p className="text-xs text-destructive font-medium">{errors.billingCountry.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="billingAddress" className="text-xs font-medium">Street Address (Optional)</Label>
                  <Input id="billingAddress" {...register("billingAddress")} placeholder="123 Studio Blvd" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="billingCity" className="text-xs font-medium">City</Label>
                    <Input id="billingCity" {...register("billingCity")} placeholder="City" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="billingPostalCode" className="text-xs font-medium">Postal / ZIP Code</Label>
                    <Input id="billingPostalCode" {...register("billingPostalCode")} placeholder="Postal code" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className="border bg-card/90 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Payment Method
                </CardTitle>
                <CardDescription>
                  Choose your preferred payment method to complete your PRO subscription.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Controller
                  control={control}
                  name="provider"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-3"
                    >
                      {razorpayAvailable && (
                        <div
                          className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                            field.value === "RAZORPAY"
                              ? "border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary/30"
                              : "border-border/80 hover:bg-muted/30"
                          }`}
                          onClick={() => field.onChange("RAZORPAY")}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="RAZORPAY" id="method-razorpay" className="shrink-0" />
                            <div>
                              <Label htmlFor="method-razorpay" className="font-semibold text-sm cursor-pointer text-foreground">
                                Pay with Razorpay
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                UPI, Cards &amp; Netbanking (India &amp; Global)
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <VisaBadge />
                            <MastercardBadge />
                            <RupayBadge />
                            <UpiBadge />
                            <NetbankingBadge />
                          </div>
                        </div>
                      )}

                      {stripeAvailable && (
                        <div
                          className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                            field.value === "STRIPE"
                              ? "border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary/30"
                              : "border-border/80 hover:bg-muted/30"
                          }`}
                          onClick={() => field.onChange("STRIPE")}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="STRIPE" id="method-stripe" className="shrink-0" />
                            <div>
                              <Label htmlFor="method-stripe" className="font-semibold text-sm cursor-pointer text-foreground">
                                Pay with Stripe
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Credit / Debit Card (Visa, Mastercard, Amex)
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <VisaBadge />
                            <MastercardBadge />
                            <AmexBadge />
                            <StripeIcon className="h-3.5 w-auto ml-1" />
                          </div>
                        </div>
                      )}

                      {paypalAvailable && (
                        <div
                          className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                            field.value === "PAYPAL"
                              ? "border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary/30"
                              : "border-border/80 hover:bg-muted/30"
                          }`}
                          onClick={() => field.onChange("PAYPAL")}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="PAYPAL" id="method-paypal" className="shrink-0" />
                            <div>
                              <Label htmlFor="method-paypal" className="font-semibold text-sm cursor-pointer text-foreground">
                                Pay with PayPal
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                PayPal Wallet &amp; Cards (Billed in USD)
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <PaypalIcon className="h-4 w-auto mr-1" />
                            <VisaBadge />
                            <MastercardBadge />
                          </div>
                        </div>
                      )}
                    </RadioGroup>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Subscription Summary & Perks */}
          <div className="space-y-6">
            <Card className="border-amber-500/40 shadow-md bg-card sticky top-20">
              <CardHeader className="border-b border-border/40 pb-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-black uppercase tracking-wider">
                    <Crown className="h-3 w-3" /> PRO PLAN
                  </span>
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
                    {isYearly ? "Annual Billing" : "Monthly Billing"}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold text-foreground mt-2">{plan.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {plan.description || "Full access to all exclusive video masterclasses, plugins, and LUT assets."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-5">
                {/* Pricing Summary */}
                <div className="flex items-baseline justify-between border-b pb-4">
                  <span className="text-sm font-medium text-muted-foreground">Membership Rate</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-foreground">{formatMoney(basePrice, currency)}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground" /> Promo or Coupon Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      className="font-mono text-xs uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      isLoading={isApplyingCoupon}
                      disabled={!couponCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponResult && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Code {couponResult.code} applied!</span>
                      <span>-{formatMoney(couponResult.discount, currency)}</span>
                    </div>
                  )}
                </div>

                {/* Total Due Today */}
                <div className="flex items-baseline justify-between pt-2 border-t font-semibold">
                  <span className="text-sm text-foreground">Total Due Today</span>
                  <span className="font-mono text-2xl font-extrabold text-foreground">
                    {formatMoney(currentTotal, currency)}
                  </span>
                </div>

                {selectedProvider === "PAYPAL" && currency === "INR" && (
                  <p className="text-[11px] text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/50 leading-relaxed">
                    Note: PayPal does not process Indian Rupee (INR). Your PRO subscription will be billed as {formatMoney(plan.priceUSD, "USD")} via PayPal.
                  </p>
                )}

                {/* PRO Perks Checklist */}
                <div className="rounded-xl bg-muted/40 p-4 space-y-2 border border-border/40 text-xs">
                  <p className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Included with PRO:</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Instant zero-extra-cost download on all PRO assets</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Full streaming access to exclusive video masterclasses</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Official subscription invoice &amp; tax receipt included</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>One-click cancellation anytime in Account Settings</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black font-extrabold shadow-md h-12 text-sm"
                  isLoading={isSubmitting}
                  loadingText="Securing Subscription..."
                >
                  <Crown className="h-4 w-4" />
                  {selectedProvider === "PAYPAL" ? "Pay with PayPal (USD)" : "Activate PRO Membership"}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>256-bit SSL encrypted. Cancel anytime.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </>
  );
}
