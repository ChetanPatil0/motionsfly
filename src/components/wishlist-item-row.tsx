"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Trash2, Eye, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

export function WishlistItemRow({
  productId,
  title,
  slug,
  thumbnail,
  priceINR,
  priceUSD,
  isFree,
  isPremium,
}: {
  productId: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  priceINR?: number;
  priceUSD?: number;
  isFree?: boolean;
  isPremium?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleRemove() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to remove item.");
        return;
      }
      toast.success("Removed from wishlist.");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 text-sm hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted border">
          {thumbnail ? (
            <Image src={thumbnail} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-5 w-5" />
            </div>
          )}
          {isPremium && (
            <Badge className="absolute left-1 top-1 text-[9px] px-1 py-0 h-4" variant="default">
              PRO
            </Badge>
          )}
        </div>

        <div className="min-w-0">
          <Link
            href={`/products/${slug}`}
            className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1 block"
          >
            {title}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs font-semibold text-primary">
              {isFree ? "Free" : priceINR !== undefined ? formatMoney(priceINR, "INR") : ""}
            </span>
            {priceUSD !== undefined && !isFree && (
              <span className="text-[11px] text-muted-foreground font-mono">
                / {formatMoney(priceUSD, "USD")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs h-8">
          <Link href={`/products/${slug}`}>
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>View Product</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          isLoading={isLoading}
          onClick={handleRemove}
          aria-label="Remove from wishlist"
          title="Remove from wishlist"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
