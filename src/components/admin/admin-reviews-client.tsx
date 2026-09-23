"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, EyeOff, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";

type Review = {
  id: string;
  rating: number;
  content: string;
  isHidden: boolean;
  user: { name: string; email: string };
  product: { title: string };
  createdAt: string;
};

async function fetchAdminReviews(): Promise<{ data: Review[] }> {
  const res = await fetch("/api/admin/reviews");
  return res.json();
}

export function AdminReviewsClient() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-reviews"], queryFn: fetchAdminReviews });

  const toggleHideMutation = useMutation({
    mutationFn: async ({ id, isHidden }: { id: string; isHidden: boolean }) => {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const reviews = data?.data ?? [];

  if (reviews.length === 0) {
    return <EmptyState icon={Star} title="No Reviews Yet" description="Customer reviews will appear here." />;
  }

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {reviews.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-4 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.product.title}</span>
                <span className="text-sm text-yellow-500">{"★".repeat(r.rating)}</span>
                {r.isHidden && <Badge variant="secondary">Hidden</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{r.content}</p>
              <p className="text-xs text-muted-foreground">by {r.user.name} ({r.user.email})</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                isLoading={toggleHideMutation.isPending && toggleHideMutation.variables?.id === r.id}
                onClick={() => toggleHideMutation.mutate({ id: r.id, isHidden: !r.isHidden })}
                aria-label={r.isHidden ? "Unhide review" : "Hide review"}
              >
                {r.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                isLoading={deleteMutation.isPending && deleteMutation.variables === r.id}
                onClick={() => deleteMutation.mutate(r.id)}
                aria-label="Delete review"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
