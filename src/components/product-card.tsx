import Image from "next/image";
import Link from "next/link";
import { ImageOff, Heart, Eye, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

export function ProductCard({
  product,
  currency = "INR",
}: {
  product: {
    slug: string;
    title: string;
    thumbnail: string | null;
    priceINR: number;
    priceUSD: number;
    isFree: boolean;
    isPremium: boolean;
    category?: { name: string } | null;
    _count?: { likes: number };
  };
  currency?: "INR" | "USD";
}) {
  const displayPrice = currency === "INR" ? product.priceINR : product.priceUSD;

  return (
    <Link href={`/products/${product.slug}`} className="group block focus:outline-hidden">
      <Card className="overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg border bg-card/90">
        <div className="relative aspect-video bg-muted overflow-hidden">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-6 w-6" />
            </div>
          )}

          {/* Hover Overlay with View Action */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-sm">
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>View Product</span>
            </span>
          </div>

          {product.isPremium && (
            <Badge
              className="absolute left-2.5 top-2.5 shadow-sm bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-[10px] tracking-wider px-2 py-0.5 border-none"
            >
              PRO
            </Badge>
          )}

          <span className="absolute bottom-2 right-2 rounded-md bg-background/90 px-2 py-0.5 font-mono text-[11px] font-semibold backdrop-blur-sm shadow-xs border">
            {product.isFree ? "FREE" : formatMoney(displayPrice, currency)}
          </span>
        </div>

        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            {product.category && (
              <p className="text-xs text-muted-foreground truncate">{product.category.name}</p>
            )}
            {product._count && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                <Heart className="h-3 w-3 fill-rose-500/20 text-rose-500" />
                <span>{product._count.likes}</span>
              </span>
            )}
          </div>

          <h3 className="line-clamp-1 font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <span className="font-mono text-xs font-bold text-foreground">
              {product.isFree ? "FREE" : formatMoney(displayPrice, currency)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <span>View</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
