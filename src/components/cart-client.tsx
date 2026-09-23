"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingCart, Trash2, ImageOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/utils";

type CartLine = {
  id: string;
  type: string;
  refId: string;
  title: string;
  thumbnail: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};
type CartResponse = { success: boolean; data: { currency: "INR" | "USD"; lines: CartLine[]; subtotal: number } };

async function fetchCart(): Promise<CartResponse> {
  const res = await fetch("/api/cart");
  return res.json();
}

export function CartClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["cart"], queryFn: fetchCart });
  const { data: settingsData } = useQuery({
    queryKey: ["store-settings-public"],
    queryFn: async () => {
      const res = await fetch("/api/settings/store");
      return res.json();
    },
  });

  const settings = settingsData?.data;
  const isCheckoutBlocked = settings && (!settings.storeActive || settings.isMaintenance);

  const removeMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const res = await fetch(`/api/cart/${lineId}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to remove item.");
        return;
      }
      toast.success("Item removed.");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Something went wrong while loading your cart.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["cart"] })}>Try Again</Button>
      </div>
    );
  }

  const { currency, lines, subtotal } = data.data;

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your Cart Is Empty"
        description="Browse products and tutorials to add them to your cart."
        actionLabel="Browse Products"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y rounded-xl border">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-4 p-4">
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
              {line.thumbnail ? (
                <Image src={line.thumbnail} alt={line.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageOff className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{line.title}</p>
              <p className="text-sm text-muted-foreground">
                {line.unitPrice === 0 ? "Free" : formatMoney(line.unitPrice, currency)} × {line.quantity}
              </p>
            </div>
            <p className="font-medium">{line.lineTotal === 0 ? "Free" : formatMoney(line.lineTotal, currency)}</p>
            <Button
              variant="ghost"
              size="icon"
              isLoading={removeMutation.isPending && removeMutation.variables === line.id}
              onClick={() => removeMutation.mutate(line.id)}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="h-fit space-y-4 rounded-xl border p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatMoney(subtotal, currency)}</span>
        </div>

        {isCheckoutBlocked && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-0.5">
              <p className="font-semibold">
                {settings.isMaintenance ? "Maintenance Mode Active" : "Store Inactive"}
              </p>
              <p className="opacity-90 leading-tight">
                {settings.isMaintenance
                  ? "Checkout is temporarily paused. Your cart is preserved and you can complete your purchase when maintenance ends."
                  : "The store is currently not accepting new orders."}
              </p>
            </div>
          </div>
        )}

        {isCheckoutBlocked ? (
          <Button disabled className="w-full cursor-not-allowed opacity-60" size="lg">
            {settings.isMaintenance ? "Checkout Paused (Maintenance)" : "Store Inactive"}
          </Button>
        ) : (
          <Button asChild className="w-full" size="lg">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
