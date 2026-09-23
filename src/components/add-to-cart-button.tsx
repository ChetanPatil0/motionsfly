"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  type,
  refId,
}: {
  type: "PRODUCT" | "TUTORIAL";
  refId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          productId: type === "PRODUCT" ? refId : undefined,
          tutorialId: type === "TUTORIAL" ? refId : undefined,
          quantity: 1,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to add to cart.");
        return;
      }
      toast.success("Added to cart.");
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button size="lg" onClick={handleAdd} isLoading={isLoading} loadingText="Adding...">
      <ShoppingCart className="h-4 w-4" /> Add to Cart
    </Button>
  );
}
