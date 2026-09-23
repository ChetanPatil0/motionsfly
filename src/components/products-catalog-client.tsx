"use client";

import { useState, useMemo } from "react";
import { Search, X, SlidersHorizontal, Crown, PackageOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";

export type ProductItem = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  priceINR: number;
  priceUSD: number;
  isFree: boolean;
  isPremium: boolean;
  categoryId: string | null;
  category: { name: string; slug?: string } | null;
  _count: { likes: number };
  createdAt: Date | string;
};

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

export function ProductsCatalogClient({
  initialProducts,
  categories,
  currency,
  isPremiumUser,
}: {
  initialProducts: ProductItem[];
  categories: CategoryItem[];
  currency: "INR" | "USD";
  isPremiumUser: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<"all" | "free" | "paid" | "premium">("all");
  const [sortBy, setSortBy] = useState<"latest" | "price_asc" | "price_desc" | "popular">("latest");

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = product.title.toLowerCase().includes(q);
          const matchesCategory = product.category?.name.toLowerCase().includes(q);
          if (!matchesTitle && !matchesCategory) return false;
        }

        // Category filter
        if (selectedCategory !== "all") {
          if (product.categoryId !== selectedCategory) return false;
        }

        // Tier filter
        if (selectedTier === "free") {
          if (!product.isFree) return false;
        } else if (selectedTier === "paid") {
          if (product.isFree || product.isPremium) return false;
        } else if (selectedTier === "premium") {
          if (!product.isPremium) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          const priceA = a.isFree ? 0 : currency === "INR" ? a.priceINR : a.priceUSD;
          const priceB = b.isFree ? 0 : currency === "INR" ? b.priceINR : b.priceUSD;
          return priceA - priceB;
        }
        if (sortBy === "price_desc") {
          const priceA = a.isFree ? 0 : currency === "INR" ? a.priceINR : a.priceUSD;
          const priceB = b.isFree ? 0 : currency === "INR" ? b.priceINR : b.priceUSD;
          return priceB - priceA;
        }
        if (sortBy === "popular") {
          return (b._count?.likes ?? 0) - (a._count?.likes ?? 0);
        }
        // latest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [initialProducts, searchQuery, selectedCategory, selectedTier, sortBy, currency]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== "all" || selectedTier !== "all";

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTier("all");
    setSortBy("latest");
  }

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* FILTER & SEARCH BAR                                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border bg-card/60 p-4 backdrop-blur shadow-sm">
        {/* Top search & sort row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title or category..."
              className="pl-9 pr-8 h-10 text-sm bg-background/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tier Filters */}
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSelectedTier("all")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedTier === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedTier("free")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedTier === "free" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => setSelectedTier("paid")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedTier === "paid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setSelectedTier("premium")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                  selectedTier === "premium"
                    ? "bg-amber-500 text-black font-semibold shadow-sm"
                    : "text-amber-500 hover:text-amber-400"
                }`}
              >
                <Crown className="h-3 w-3" />
                PRO Only
              </button>
            </div>

            {/* Sort selector */}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-10 w-[150px] text-xs bg-background/80">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Newest First</SelectItem>
                <SelectItem value="popular">Most Liked</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Categories ({initialProducts.length})
          </button>
          {categories.map((cat) => {
            const count = initialProducts.filter((p) => p.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.name} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>

        {/* Active filter count & clear row */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{filteredProducts.length}</strong> of {initialProducts.length} products
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-primary hover:underline font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* PRODUCTS GRID / EMPTY STATE                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {filteredProducts.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <EmptyState
            icon={PackageOpen}
            title="No Products Found"
            description="No products matched your search or active filters."
          />
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
