import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { DownloadCloud, CheckCircle2, ShieldCheck, Crown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { LikeButton } from "@/components/like-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ReviewsSection } from "@/components/reviews-section";
import { ProductGallery } from "@/components/product-gallery";
import { RichDescription } from "@/components/rich-description";
import { ProductCard } from "@/components/product-card";
import { formatMoney } from "@/lib/utils";

import { getCurrentUser } from "@/lib/session";
import { ProductDownloadAction } from "@/components/product-download-action";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};
  return {
    title: product.title,
    description: product.shortDescription ?? product.description.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.shortDescription ?? undefined,
      images: product.thumbnail ? [product.thumbnail] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const currencyView = (cookies().get("mf_currency_view")?.value as "INR" | "USD" | undefined) ?? "INR";
  const user = await getCurrentUser();
  const userId = user ? (user as { id: string }).id : null;

  const [product, activeSub, purchase] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: params.slug },
      include: { category: true, _count: { select: { likes: true, reviews: true } } },
    }),
    userId
      ? prisma.subscription.findFirst({
          where: {
            userId,
            status: "ACTIVE",
            currentPeriodEnd: { gt: new Date() },
          },
        })
      : Promise.resolve(null),
    userId
      ? prisma.orderItem.findFirst({
          where: {
            product: { slug: params.slug },
            order: { userId, status: "PAID", paymentStatus: "SUCCESS" },
          },
        })
      : Promise.resolve(null),
  ]);

  if (!product || !product.isPublished || product.deletedAt) notFound();

  const isSubscribed = !!activeSub;
  const hasPurchased = !!purchase;

  const relatedProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    take: 4,
    include: { category: { select: { name: true } }, _count: { select: { likes: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container grid grid-cols-1 gap-10 py-12 lg:grid-cols-2">
      {/* Interactive Gallery Showcase (Thumbnails + Demo GIFs + Lightbox zoom) */}
      <div className="space-y-4">
        <ProductGallery
          title={product.title}
          thumbnail={product.thumbnail}
          images={product.images}
        />

        {/* Quick Highlights / Trust Badges */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border bg-muted/20 p-3 text-center text-xs">
          <div className="flex flex-col items-center gap-1">
            <DownloadCloud className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Instant Delivery</span>
            <span className="text-[10px] text-muted-foreground">Download right away</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-border/50">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="font-medium text-foreground">Verified Files</span>
            <span className="text-[10px] text-muted-foreground">Pre-tested &amp; ready</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-signal" />
            <span className="font-medium text-foreground">Safe Checkout</span>
            <span className="text-[10px] text-muted-foreground">Secure payment</span>
          </div>
        </div>
      </div>

      {/* Product Details & Actions */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <Badge variant="outline">{product.category.name}</Badge>}
            <Badge variant="secondary" className="capitalize">
              {product.type.toLowerCase().replaceAll("_", " ")}
            </Badge>
            {product.isPremium && (
              <Badge variant="default" className="gap-1 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold border-none shadow-sm">
                <Crown className="h-3 w-3" /> PRO
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
          {product.shortDescription && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Price & Access Status */}
        {hasPurchased ? (
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-success font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" /> You own this asset
            </div>
            <p className="text-xs text-muted-foreground">
              You have already purchased this item. You can re-download it below.
            </p>
            <ProductDownloadAction
              productId={product.id}
              isPremium={product.isPremium}
              isFree={product.isFree}
              isSubscribed={isSubscribed}
              hasPurchased={hasPurchased}
              isLoggedIn={!!userId}
            />
          </div>
        ) : product.isPremium && isSubscribed ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
              <Crown className="h-4 w-4" /> Included with your PRO Membership
            </div>
            <p className="text-xs text-muted-foreground">
              As an active PRO subscriber, you get instant complimentary access to this premium asset.
            </p>
            <ProductDownloadAction
              productId={product.id}
              isPremium={product.isPremium}
              isFree={product.isFree}
              isSubscribed={isSubscribed}
              hasPurchased={hasPurchased}
              isLoggedIn={!!userId}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {product.isFree ? "Free" : formatMoney(product.priceINR, "INR")}
              </span>
              {!product.isFree && (
                <span className="text-sm text-muted-foreground">/ {formatMoney(product.priceUSD, "USD")}</span>
              )}
            </div>

            {product.isFree ? (
              <ProductDownloadAction
                productId={product.id}
                isPremium={product.isPremium}
                isFree={product.isFree}
                isSubscribed={isSubscribed}
                hasPurchased={hasPurchased}
                isLoggedIn={!!userId}
              />
            ) : null}

            <div className="flex items-center gap-2">
              <AddToCartButton type="PRODUCT" refId={product.id} />
              <WishlistButton productId={product.id} />
              <LikeButton productId={product.id} />
            </div>
          </div>
        )}

        {(hasPurchased || (product.isPremium && isSubscribed)) && (
          <div className="flex items-center gap-2 pt-1">
            <WishlistButton productId={product.id} />
            <LikeButton productId={product.id} />
          </div>
        )}

        {/* Detailed Formatted Description & What It Contains */}
        <div className="space-y-3 border-t pt-6">
          <h2 className="text-base font-semibold text-foreground">
            What&apos;s Included &amp; Description
          </h2>
          <RichDescription content={product.description} />
        </div>

        <p className="text-xs text-muted-foreground">
          {product._count.reviews} {product._count.reviews === 1 ? "Review" : "Reviews"} &middot; {product._count.likes} {product._count.likes === 1 ? "Like" : "Likes"}
        </p>
      </div>

      <div className="col-span-full">
        <ReviewsSection productId={product.id} />
      </div>

      {relatedProducts.length > 0 && (
        <div className="col-span-full border-t pt-10 mt-4 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                You May Also Like
              </h2>
              <p className="text-sm text-muted-foreground">
                Recommended assets matching your timeline workflow
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">Explore Catalog &rarr;</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} currency={currencyView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
