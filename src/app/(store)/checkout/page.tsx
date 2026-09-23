import { CheckoutClient } from "@/components/checkout-client";

export const metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <div className="container max-w-5xl py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Checkout</h1>
      <CheckoutClient />
    </div>
  );
}
