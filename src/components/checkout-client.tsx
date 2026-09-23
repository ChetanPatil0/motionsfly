"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Script from "next/script";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck, Lock, CheckCircle2, User, Mail, MapPin, Building, CreditCard, Tag } from "lucide-react";
import { PaymentProcessingModal, type PaymentModalStatus } from "@/components/payment-processing-modal";
import {
  RazorpayIcon,
  PaypalIcon,
  StripeIcon,
  VisaBadge,
  MastercardBadge,
  AmexBadge,
  RupayBadge,
  UpiBadge,
  NetbankingBadge,
} from "@/components/payment-icons";
export {
  RazorpayIcon,
  PaypalIcon,
  StripeIcon,
  VisaBadge,
  MastercardBadge,
  AmexBadge,
  RupayBadge,
  UpiBadge,
  NetbankingBadge,
};
import { checkoutSchema, type CheckoutInput } from "@/schemas/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/utils";
import { COUNTRIES, countryName } from "@/constants/countries";

declare global {
  interface Window {
    Razorpay: any;
  }
}

async function fetchCart() {
  const res = await fetch("/api/cart");
  return res.json();
}
async function fetchSettings() {
  const res = await fetch("/api/settings/store");
  return res.json();
}
async function fetchProfile() {
  const res = await fetch("/api/account/profile");
  return res.json();
}

export function CheckoutClient() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const { data: cartData, isLoading: cartLoading } = useQuery({ queryKey: ["cart"], queryFn: fetchCart });
  // Settings are refetched on every mount and window focus (default TanStack
  // behavior) so a change the admin makes takes effect immediately here —
  // this is what fixes provider toggles not being respected live.
  const { data: settingsData } = useQuery({ queryKey: ["store-settings-public"], queryFn: fetchSettings });
  const { data: profileData } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile, enabled: isLoggedIn });
  const settings = settingsData?.data;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponResult, setCouponResult] = useState<{ discount: number; total: number } | null>(null);
  const [couponCodeValue, setCouponCodeValue] = useState("");
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    status: PaymentModalStatus;
    orderNumber: string;
    approveUrl: string;
    errorMessage?: string;
  }>({
    isOpen: false,
    status: "PROCESSING",
    orderNumber: "",
    approveUrl: "",
  });

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
          window.location.href = `/checkout/success?order=${encodeURIComponent(e.data.orderNumber || orderNum)}`;
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

      // Timeout after 80s of polling
      if (pollCount > maxPollCount) {
        clearInterval(pollTimer);
        setPaymentModalState((prev) => ({
          ...prev,
          status: "FAILED",
          errorMessage: "Payment verification timed out. If your payment was completed, please refresh the page or check your account.",
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
              window.location.href = `/checkout/success?order=${encodeURIComponent(orderNum)}`;
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
        // network glitch retry
      }
    }, 2000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(pollTimer);
    };
  }, [paymentModalState.isOpen, paymentModalState.status, paymentModalState.orderNumber]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { provider: "RAZORPAY", billingCountry: "IN" },
  });

  // Logged-in users' country was fixed at registration — auto-fill and lock it.
  useEffect(() => {
    if (isLoggedIn && profileData?.data?.country) {
      setValue("billingCountry", profileData.data.country);
      setValue("email", profileData.data.email);
      setValue("billingName", profileData.data.name);
    }
  }, [isLoggedIn, profileData, setValue]);

  const razorpayAvailable = !!settings?.razorpayEnabled;
  const stripeAvailable = !!settings?.stripeEnabled;
  const paypalAvailable = !!settings?.paypalEnabled;

  useEffect(() => {
    if (!settings) return;
    const current = watch("provider");
    if (current === "RAZORPAY" && !settings.razorpayEnabled) {
      if (settings.stripeEnabled) setValue("provider", "STRIPE");
      else if (settings.paypalEnabled) setValue("provider", "PAYPAL");
    }
  }, [settings, setValue, watch]);

  async function applyCoupon() {
    if (!couponCodeValue.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCodeValue }),
      });
      const json = await res.json();
      if (!json.success) {
        setCouponResult(null);
        setCouponMessage(json.message ?? "Invalid coupon.");
        toast.error(json.message ?? "Invalid coupon.");
        return;
      }
      setCouponResult({ discount: json.data.discount, total: json.data.total });
      setCouponMessage("Coupon applied successfully.");
      toast.success("Coupon applied successfully.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  const cart = cartData?.data;
  const watchedCountry = watch("billingCountry");
  const finalTotal = cart ? (couponResult ? couponResult.total : cart.subtotal) : null;
  // Deliberately based on the cart's ORIGINAL subtotal, not the post-coupon
  // total — a coupon discounting a paid cart to near-zero must still go
  // through a real payment method, never be treated as "free" content.
  const isFreeOrder = cart?.subtotal === 0;

  // Available payment methods supporting India businesses and international payments.
  const availableProviders: {
    value: "RAZORPAY" | "STRIPE" | "PAYPAL";
    title: string;
    subtitle: string;
    description: string;
    badges: React.ReactNode;
  }[] = [];

  if (razorpayAvailable) {
    availableProviders.push({
      value: "RAZORPAY",
      title: "Pay with Razorpay",
      subtitle: "UPI, Cards & Netbanking (India & Global)",
      description: "",
      badges: (
        <div className="flex flex-wrap items-center gap-1.5">
          <VisaBadge />
          <MastercardBadge />
          <RupayBadge />
          <UpiBadge />
          <NetbankingBadge />
        </div>
      ),
    });
  }

  if (stripeAvailable) {
    availableProviders.push({
      value: "STRIPE",
      title: "Pay with Stripe",
      subtitle: "Credit / Debit Card (Visa, Mastercard, Amex)",
      description: "",
      badges: (
        <div className="flex flex-wrap items-center gap-1.5">
          <VisaBadge />
          <MastercardBadge />
          <AmexBadge />
          <StripeIcon className="h-3.5 w-auto ml-1" />
        </div>
      ),
    });
  }

  if (paypalAvailable) {
    availableProviders.push({
      value: "PAYPAL",
      title: "Pay with PayPal",
      subtitle: "PayPal Wallet & Cards (Billed in USD)",
      description: "",
      badges: (
        <div className="flex flex-wrap items-center gap-1.5">
          <PaypalIcon className="h-4 w-auto mr-1" />
          <VisaBadge />
          <MastercardBadge />
        </div>
      ),
    });
  }

  async function onSubmit(values: CheckoutInput) {
    if (settings && (!settings.storeActive || settings.isMaintenance)) {
      toast.error(
        settings.isMaintenance
          ? "Checkout is temporarily paused due to maintenance."
          : "The store is currently not accepting new orders."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isFreeOrder) {
        const res = await fetch("/api/checkout/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email, billingName: values.billingName }),
        });
        const json = await res.json();
        if (!json.success) {
          toast.error(json.message ?? "Unable to process your order.");
          setIsSubmitting(false);
          return;
        }
        window.location.href = `/checkout/success?order=${json.data.orderNumber}`;
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, couponCode: couponResult ? couponCodeValue : undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to process checkout.");
        setIsSubmitting(false);
        return;
      }

      const { order, providerData } = json.data;

      if (values.provider === "RAZORPAY") {
        if (!window.Razorpay) {
          toast.error("Payment gateway is initializing. Please click Pay again in a moment.");
          setIsSubmitting(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: providerData.keyId,
          order_id: providerData.razorpayOrderId,
          amount: order.total,
          currency: order.currency,
          name: "MotionFly",
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
            try {
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
                  window.location.href = `/checkout/success?order=${encodeURIComponent(order.orderNumber)}`;
                }, 800);
              } else {
                setPaymentModalState((prev) => ({
                  ...prev,
                  status: "FAILED",
                  errorMessage: verifyJson.message ?? "Payment verification failed.",
                }));
                setIsSubmitting(false);
              }
            } catch {
              setPaymentModalState((prev) => ({
                ...prev,
                status: "FAILED",
                errorMessage: "Failed to confirm payment with the server. Please contact support if your account was charged.",
              }));
              setIsSubmitting(false);
            }
          },
          prefill: { email: values.email, name: values.billingName },
          theme: { color: "#0f172a" },
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

        // Try popup window, and gracefully fall back to full redirect if popup was blocked by mobile browser
        const popup = window.open(providerData.approveUrl, "_blank");
        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          window.location.href = providerData.approveUrl;
          return;
        }

        setIsSubmitting(false);
        return;
      }

      if (values.provider === "STRIPE") {
        if (providerData?.checkoutUrl) {
          window.location.href = providerData.checkoutUrl;
          return;
        } else {
          toast.error("Stripe checkout could not be initialized.");
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);
    } catch (err: any) {
      toast.error(err?.message ?? "An unexpected error occurred during checkout.");
      setIsSubmitting(false);
    }
  }

  if (cartLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (settings && (!settings.storeActive || settings.isMaintenance)) {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center max-w-lg mx-auto">
        <div
          className={`rounded-full p-4 ${
            settings.isMaintenance ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
          }`}
        >
          <AlertTriangle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {settings.isMaintenance ? "Checkout Temporarily Paused" : "Store Currently Inactive"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {settings.isMaintenance
              ? "We are currently performing scheduled maintenance and updates on MotionFly. Payment processing and checkouts are temporarily paused. Your cart items are safe and you will be able to complete your order shortly!"
              : "MotionFly is currently not accepting new orders at this time. Please check back soon."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link href="/cart">Return to Cart</Link>
          </Button>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
        {settings.supportEmail && (
          <p className="text-xs text-muted-foreground pt-4">
            Need assistance? Reach our support team at{" "}
            <a href={`mailto:${settings.supportEmail}`} className="underline text-foreground font-medium">
              {settings.supportEmail}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {availableProviders.some((p) => p.value === "RAZORPAY") && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      )}
      <PaymentProcessingModal
        isOpen={paymentModalState.isOpen}
        status={paymentModalState.status}
        orderNumber={paymentModalState.orderNumber}
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
          } else {
            setPaymentModalState((prev) => ({ ...prev, isOpen: false }));
            setIsSubmitting(false);
          }
        }}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="space-y-6">
          {/* Step 1: Contact & Billing */}
          <Card className="rounded-2xl border bg-card/90 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                  1
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Contact &amp; Billing Details</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Where your invoice and download access will be sent</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoggedIn}
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                    <span>&bull;</span> {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="billingName" className="text-xs font-semibold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Full Name</span>
                </Label>
                <Input
                  id="billingName"
                  placeholder="Jane Doe"
                  {...register("billingName")}
                  aria-invalid={!!errors.billingName}
                  className={errors.billingName ? "border-destructive focus-visible:ring-destructive/20" : ""}
                />
                {errors.billingName && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                    <span>&bull;</span> {errors.billingName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="billingAddress" className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Street Address</span>
                </Label>
                <Input
                  id="billingAddress"
                  placeholder="123 Creative Street, Studio 4"
                  {...register("billingAddress")}
                  aria-invalid={!!errors.billingAddress}
                  className={errors.billingAddress ? "border-destructive focus-visible:ring-destructive/20" : ""}
                />
                {errors.billingAddress && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                    <span>&bull;</span> {errors.billingAddress.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="billingCity" className="text-xs font-semibold flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>City</span>
                  </Label>
                  <Input id="billingCity" placeholder="Mumbai / New York" {...register("billingCity")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Country</Label>
                  {isLoggedIn ? (
                    <>
                      <input type="hidden" {...register("billingCountry")} />
                      <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-xs text-muted-foreground">
                        {countryName(watchedCountry || "IN")}
                      </div>
                    </>
                  ) : (
                    <Controller
                      name="billingCountry"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.code} className="text-xs">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                  {errors.billingCountry && (
                    <p className="text-xs text-destructive font-medium mt-1">
                      <span>&bull;</span> {errors.billingCountry.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="billingPostalCode" className="text-xs font-semibold">Postal Code</Label>
                  <Input id="billingPostalCode" placeholder="400001 / 10001" {...register("billingPostalCode")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Payment Method Selection */}
          {!isFreeOrder && (
            <Card className="rounded-2xl border bg-card/90 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                    2
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">Payment Method</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select your preferred payment method. All transactions are securely 256-bit encrypted.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {availableProviders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No payment method is currently available for this currency. Please contact support.
                  </p>
                ) : (
                  <Controller
                    name="provider"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                        {availableProviders.map((p) => {
                          const isSelected = field.value === p.value;
                          return (
                            <label
                              key={p.value}
                              className={`flex cursor-pointer items-center justify-between gap-3.5 rounded-xl border p-4 transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary/30"
                                  : "border-border/80 hover:bg-muted/30 hover:border-border"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <RadioGroupItem value={p.value} className="shrink-0" />
                                <div>
                                  <span className="font-semibold text-sm text-foreground">
                                    {p.title}
                                  </span>
                                  {p.subtitle && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {p.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0">{p.badges}</div>
                            </label>
                          );
                        })}
                      </RadioGroup>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Step 3: Order Summary Sidebar */}
        <div className="h-fit space-y-4 rounded-2xl border bg-card/95 p-5 sm:p-6 shadow-md backdrop-blur-sm lg:sticky lg:top-20">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-base text-foreground">Order Summary</h2>
            <span className="text-xs text-muted-foreground font-medium">
              {cart?.lines?.length ?? 0} item{cart?.lines?.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Instant Access Banner */}
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">Instant download token unlocked on order</span>
          </div>

          {cart && (
            <>
              {cart.lines?.length > 0 && (
                <ul className="space-y-2.5 border-b pb-4 max-h-56 overflow-y-auto pr-1">
                  {cart.lines.map((line: any) => (
                    <li key={line.id} className="flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{line.title}</p>
                        {line.quantity > 1 && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatMoney(line.unitPrice, cart.currency)} &times; {line.quantity}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-mono font-semibold text-foreground">
                        {line.lineTotal === 0 ? "Free" : formatMoney(line.lineTotal, cart.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono font-medium">{formatMoney(cart.subtotal, cart.currency)}</span>
                </div>

                {!isFreeOrder && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="couponCode" className="text-xs font-semibold flex items-center gap-1 text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      <span>Have a discount coupon?</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="couponCode"
                        placeholder="SUMMER25"
                        value={couponCodeValue}
                        onChange={(e) => {
                          setCouponCodeValue(e.target.value);
                          setCouponResult(null);
                        }}
                        className="text-xs h-8 uppercase font-mono tracking-wider"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isLoading={isApplyingCoupon}
                        loadingText="..."
                        onClick={applyCoupon}
                        className="text-xs h-8 px-3"
                      >
                        Apply
                      </Button>
                    </div>
                    {couponMessage && (
                      <p className={`text-xs font-medium ${couponResult ? "text-emerald-500" : "text-destructive"}`}>
                        {couponMessage}
                      </p>
                    )}
                  </div>
                )}

                {couponResult && (
                  <div className="flex justify-between text-xs text-emerald-500 font-semibold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <span>Discount Applied</span>
                    <span>-{formatMoney(couponResult.discount, cart.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline border-t pt-3 font-bold text-base">
                  <span>Total Due</span>
                  <span className="font-mono text-xl text-primary">
                    {isFreeOrder ? "Free" : formatMoney(cart.subtotal - (couponResult?.discount ?? 0), cart.currency)}
                  </span>
                </div>

                {!isFreeOrder && watch("provider") === "PAYPAL" && cart.currency === "INR" && (
                  <p className="text-[11px] text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/50 leading-relaxed">
                    Note: PayPal does not process Indian Rupee (INR). Your cart will be billed in USD equivalent via PayPal.
                  </p>
                )}
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full mt-2 font-bold shadow-lg shadow-primary/25 h-11 text-sm gap-2"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Processing Payment..."
            disabled={!isFreeOrder && availableProviders.length === 0}
          >
            <Lock className="h-4 w-4" />
            <span>
              {isFreeOrder
                ? "Claim Free Download"
                : watch("provider") === "PAYPAL"
                ? "Pay with PayPal (USD)"
                : "Pay & Complete Order"}
            </span>
          </Button>

          {/* Security & Guarantee Strip */}
          <div className="pt-3 border-t space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>256-Bit Bank Grade SSL Encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Official License &amp; Instant PDF Invoice</span>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
