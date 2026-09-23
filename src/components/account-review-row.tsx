"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Trash2, Eye, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function AccountReviewRow({
  id,
  productTitle,
  productSlug,
  productThumbnail,
  rating,
  content,
}: {
  id: string;
  productTitle: string;
  productSlug: string;
  productThumbnail?: string | null;
  rating: number;
  content: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleConfirmDelete() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to delete review.");
        return;
      }
      toast.success("Review deleted successfully.");
      setShowModal(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <li className="rounded-xl border bg-card/60 p-4 shadow-xs transition-all hover:border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted border">
              {productThumbnail ? (
                <Image src={productThumbnail} alt={productTitle} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageOff className="h-4 w-4" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight text-foreground">{productTitle}</p>
              <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                {"★".repeat(rating)}
                {"☆".repeat(Math.max(0, 5 - rating))}
                <span className="text-[11px] text-muted-foreground ml-1.5 font-medium">({rating}/5)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs h-8">
              <Link href={`/products/${productSlug}`}>
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span>View Product</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowModal(true)}
              aria-label="Delete review"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed pl-0 sm:pl-[76px]">{content}</p>
      </li>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
        title="Delete Review?"
        description="Are you sure you want to delete this review? It will be permanently removed from the product page."
        confirmText="Delete Review"
        variant="destructive"
      />
    </>
  );
}
