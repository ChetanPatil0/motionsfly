"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type Category = { id: string; name: string; slug: string };

async function fetchCategories(): Promise<{ data: Category[] }> {
  const res = await fetch("/api/categories");
  return res.json();
}

export function CategoriesManager() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const createMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to create category.");
        return;
      }
      toast.success("Category created successfully.");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to delete category.");
        return;
      }
      toast.success("Category deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>

      <form
        className="flex max-w-sm gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createMutation.mutate(name.trim());
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
        <Button type="submit" isLoading={createMutation.isPending} loadingText="Adding...">
          Add
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Tags} title="No Categories Yet" description="Create your first category above." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {data.data.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-3 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    isLoading={deleteMutation.isPending && deleteMutation.variables === c.id}
                    onClick={() => deleteMutation.mutate(c.id)}
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
