"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

type Review = { id: string; rating: number; content: string; createdAt: string; user: { name: string } };

export function ReviewsSection({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, content }),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to submit review.");
        return;
      }
      toast.success("Review submitted successfully.");
      setContent("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
  });

  const reviews: Review[] = data?.data ?? [];

  return (
    <div className="space-y-6 border-t pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {showForm && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-5 w-5 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              isLoading={submitMutation.isPending}
              loadingText="Submitting..."
              disabled={content.trim().length < 5}
              onClick={() => submitMutation.mutate()}
            >
              Submit Review
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Only customers who purchased this product can submit a review.</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{r.user.name}</span>
                <span className="text-sm text-yellow-500">{"★".repeat(r.rating)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
