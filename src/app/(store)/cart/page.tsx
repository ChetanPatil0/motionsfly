import { CartClient } from "@/components/cart-client";

export const metadata = { title: "Cart", robots: { index: false, follow: false } };

export default function CartPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Your Cart</h1>
      <CartClient />
    </div>
  );
}
