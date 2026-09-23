import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { AccountReviewRow } from "@/components/account-review-row";

export default async function AccountReviewsPage() {
  const user = await getCurrentUser();
  const reviews = await prisma.review.findMany({
    where: { userId: (user as { id: string }).id, deletedAt: null },
    include: { product: { select: { title: true, slug: true, thumbnail: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">Feedback and ratings you've submitted for purchased items.</p>
      </div>
      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No Reviews Yet"
          description="Reviews you write for purchased products will appear here."
          actionLabel="Browse Products"
          actionHref="/products"
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <AccountReviewRow
              key={r.id}
              id={r.id}
              productTitle={r.product.title}
              productSlug={r.product.slug}
              productThumbnail={r.product.thumbnail}
              rating={r.rating}
              content={r.content}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
