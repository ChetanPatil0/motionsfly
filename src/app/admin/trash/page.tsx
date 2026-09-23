"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  Search,
  Package,
  GraduationCap,
  ImageOff,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { formatMoney } from "@/lib/utils";

type TrashProduct = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  priceINR: number;
  priceUSD: number;
  deletedAt: string;
};

type TrashTutorial = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  accessType: string;
  deletedAt: string;
};

async function fetchTrash(): Promise<{
  data: { products: TrashProduct[]; tutorials: TrashTutorial[] };
}> {
  const res = await fetch("/api/admin/trash");
  return res.json();
}

const RETENTION_DAYS = 15;

function getDaysRemaining(deletedAtString: string) {
  const deletedTime = new Date(deletedAtString).getTime();
  const elapsedMs = Date.now() - deletedTime;
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, RETENTION_DAYS - elapsedDays);
  return { elapsedDays, remaining };
}

export default function AdminTrashPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ALL" | "PRODUCTS" | "TUTORIALS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<{
    type: "PRODUCT" | "TUTORIAL";
    id: string;
    title: string;
  } | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-trash"], queryFn: fetchTrash });

  const restoreMutation = useMutation({
    mutationFn: async ({ type, id }: { type: "PRODUCT" | "TUTORIAL"; id: string }) => {
      const res = await fetch("/api/admin/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to restore item.");
        return;
      }
      toast.success(json.message);
      queryClient.invalidateQueries({ queryKey: ["admin-trash"] });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: "PRODUCT" | "TUTORIAL"; id: string }) => {
      const res = await fetch("/api/admin/trash", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to permanently delete item.");
        return;
      }
      toast.success("Item permanently deleted from database and storage.");
      setPermanentDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-trash"] });
    },
  });

  const products = data?.data.products ?? [];
  const tutorials = data?.data.tutorials ?? [];

  // Combine and sort with latest deleted first
  const combinedItems = [
    ...products.map((p) => ({ ...p, itemType: "PRODUCT" as const })),
    ...tutorials.map((t) => ({ ...t, itemType: "TUTORIAL" as const })),
  ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  const filteredItems = combinedItems.filter((item) => {
    if (activeTab === "PRODUCTS" && item.itemType !== "PRODUCT") return false;
    if (activeTab === "TUTORIALS" && item.itemType !== "TUTORIAL") return false;
    if (searchQuery.trim()) {
      return item.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trash &amp; Data Retention</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Soft-deleted records are automatically retained for {RETENTION_DAYS} days before being purged.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
          <Clock className="h-4 w-4 text-amber-500" />
          <span>Dynamic {RETENTION_DAYS}-Day Auto-Purge Policy</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center rounded-xl bg-muted/50 p-1 border">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Items ({combinedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PRODUCTS")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "PRODUCTS"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TUTORIALS")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "TUTORIALS"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tutorials ({tutorials.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : combinedItems.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash Is Clean & Empty"
          description="There are currently no deleted products or masterclass tutorials in the trash."
        />
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border bg-card/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">No deleted items match &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card/80 divide-y overflow-hidden shadow-xs">
          {filteredItems.map((item) => {
            const { elapsedDays, remaining } = getDaysRemaining(item.deletedAt);
            const isUrgent = remaining <= 3;
            const isProduct = item.itemType === "PRODUCT";

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                {/* Item Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted border">
                    {item.thumbnail ? (
                      <Image src={item.thumbnail} alt={item.title} fill className="object-cover opacity-75" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                    <span className="absolute top-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white uppercase">
                      {isProduct ? "Product" : "Tutorial"}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground line-clamp-1">{item.title}</p>
                      {isProduct && "priceINR" in item && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {formatMoney(item.priceINR, "INR")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-muted-foreground">
                        Deleted {elapsedDays === 0 ? "today" : `${elapsedDays}d ago`} (
                        {new Date(item.deletedAt).toLocaleDateString()})
                      </span>
                      <span className="text-muted-foreground">&middot;</span>
                      {/* Dynamic Retention Countdown Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                          isUrgent
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {isUrgent ? <Flame className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span>
                          {remaining === 0 ? "Purging today" : `Purges in ${remaining} day${remaining > 1 ? "s" : ""}`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Restore & Permanent Delete */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={
                      restoreMutation.isPending &&
                      restoreMutation.variables?.id === item.id
                    }
                    onClick={() =>
                      restoreMutation.mutate({
                        type: item.itemType,
                        id: item.id,
                      })
                    }
                    className="gap-1.5 text-xs h-8"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Restore</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setPermanentDeleteTarget({
                        type: item.itemType,
                        id: item.id,
                        title: item.title,
                      })
                    }
                    className="gap-1 text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Permanently Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sm:inline hidden">Delete Forever</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={() => {
          if (permanentDeleteTarget) {
            permanentDeleteMutation.mutate({
              type: permanentDeleteTarget.type,
              id: permanentDeleteTarget.id,
            });
          }
        }}
        isLoading={permanentDeleteMutation.isPending}
        title="Permanently Delete Item?"
        description={`Are you sure you want to permanently delete "${permanentDeleteTarget?.title}"? It will be immediately removed from the database, and all associated media files will be deleted from disk storage. This cannot be undone.`}
        confirmText="Delete Forever"
        variant="destructive"
      />
    </div>
  );
}
