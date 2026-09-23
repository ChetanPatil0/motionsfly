"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LikeButton({ productId }: { productId: string }) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["like", productId],
    queryFn: async () => {
      const res = await fetch(`/api/likes?productId=${productId}`);
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "You must be logged in to like products.");
        return;
      }
      queryClient.setQueryData(["like", productId], json);
    },
  });

  const liked = data?.data?.liked ?? false;
  const count = data?.data?.count ?? 0;

  return (
    <Button
      variant="outline"
      isLoading={mutation.isPending}
      onClick={() => mutation.mutate()}
      aria-pressed={liked}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-destructive text-destructive")} />
      {count.toLocaleString()} {count === 1 ? "Like" : "Likes"}
    </Button>
  );
}
