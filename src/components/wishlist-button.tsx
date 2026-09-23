"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [inWishlist, setInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function toggle() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: inWishlist ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "You must be logged in to use your wishlist.");
        return;
      }
      setInWishlist(json.data.inWishlist);
      queryClient.invalidateQueries({ queryKey: ["wishlist-count"] });
      toast.success(json.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="outline" size="icon" isLoading={isLoading} onClick={toggle} aria-pressed={inWishlist} aria-label="Toggle wishlist">
      <Bookmark className={cn("h-4 w-4", inWishlist && "fill-foreground")} />
    </Button>
  );
}
