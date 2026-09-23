import { Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { WishlistItemRow } from "@/components/wishlist-item-row";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: (user as { id: string }).id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              priceINR: true,
              priceUSD: true,
              isFree: true,
              isPremium: true,
            },
          },
        },
      },
    },
  });

  const items = wishlist?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
        <p className="text-sm text-muted-foreground mt-1">Saved digital products and templates you love.</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your Wishlist Is Empty"
          description="Save products you like while browsing and find them quickly here."
          actionLabel="Explore Products"
          actionHref="/products"
        />
      ) : (
        <ul className="divide-y rounded-2xl border bg-card/50 overflow-hidden shadow-xs">
          {items.map((item) => (
            <WishlistItemRow
              key={item.id}
              productId={item.product.id}
              title={item.product.title}
              slug={item.product.slug}
              thumbnail={item.product.thumbnail}
              priceINR={item.product.priceINR}
              priceUSD={item.product.priceUSD}
              isFree={item.product.isFree}
              isPremium={item.product.isPremium}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
