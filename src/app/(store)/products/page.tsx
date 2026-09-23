import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ProductsCatalogClient } from "@/components/products-catalog-client";

export const metadata = { title: "Products & Assets | MotionFly" };

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const currencyView = (cookies().get("mf_currency_view")?.value as "INR" | "USD" | undefined) ?? "INR";

  const [products, categories, activeSub] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { likes: true } },
      },
      take: 120,
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    user && (user as { id?: string }).id
      ? prisma.subscription.findFirst({
          where: {
            userId: (user as { id: string }).id,
            status: "ACTIVE",
            currentPeriodEnd: { gt: new Date() },
          },
        })
      : null,
  ]);

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Browse Digital Assets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore production-ready transitions, LUTs, titles, audio, and plugins designed for creators and editors.
        </p>
      </div>

      <ProductsCatalogClient
        initialProducts={products as any}
        categories={categories}
        currency={currencyView}
        isPremiumUser={!!activeSub}
      />
    </div>
  );
}
