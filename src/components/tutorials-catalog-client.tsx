"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, ImageOff, Play, ArrowRight, Search, X, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export type TutorialItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  accessType: "FREE" | "PAID" | "PREMIUM";
  priceINR: number;
  priceUSD: number;
  categoryId: string | null;
  category: { name: string; slug?: string } | null;
  createdAt: Date | string;
};

export type TutorialCategory = {
  id: string;
  name: string;
  slug: string;
};

export function TutorialsCatalogClient({
  initialTutorials,
  categories,
  isPremiumUser,
}: {
  initialTutorials: TutorialItem[];
  categories: TutorialCategory[];
  isPremiumUser: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAccess, setSelectedAccess] = useState<"all" | "FREE" | "PAID" | "PREMIUM">("all");

  const filteredTutorials = useMemo(() => {
    return initialTutorials.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesCat = t.category?.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      if (selectedCategory !== "all") {
        if (t.categoryId !== selectedCategory) return false;
      }

      if (selectedAccess !== "all") {
        if (t.accessType !== selectedAccess) return false;
      }

      return true;
    });
  }, [initialTutorials, searchQuery, selectedCategory, selectedAccess]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== "all" || selectedAccess !== "all";

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedAccess("all");
  }

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* FILTER & SEARCH BAR                                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border bg-card/60 p-4 backdrop-blur shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorials by title, topic, or technique..."
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

          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5 text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={() => setSelectedAccess("all")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedAccess === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedAccess("FREE")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedAccess === "FREE" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setSelectedAccess("PAID")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedAccess === "PAID" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => setSelectedAccess("PREMIUM")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                selectedAccess === "PREMIUM"
                  ? "bg-amber-500 text-black font-semibold shadow-sm"
                  : "text-amber-500 hover:text-amber-400"
              }`}
            >
              <Crown className="h-3 w-3" />
              PRO Only
            </button>
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
            All Disciplines ({initialTutorials.length})
          </button>
          {categories.map((cat) => {
            const count = initialTutorials.filter((t) => t.categoryId === cat.id).length;
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
              Showing <strong className="text-foreground">{filteredTutorials.length}</strong> of {initialTutorials.length} masterclasses
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
      {/* TUTORIALS GRID / EMPTY STATE                                */}
      {/* ─────────────────────────────────────────────────────────── */}
      {filteredTutorials.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <EmptyState
            icon={GraduationCap}
            title="No Tutorials Found"
            description="No masterclasses matched your search query or filter selection."
          />
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTutorials.map((t) => (
            <Link key={t.id} href={`/tutorials/${t.slug}`} className="group block focus:outline-hidden">
              <Card className="overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg border bg-card/90">
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {t.thumbnail ? (
                    <Image
                      src={t.thumbnail}
                      alt={t.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageOff className="h-6 w-6" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Watch Tutorial</span>
                    </span>
                  </div>

                  <Badge
                    className={`absolute left-2.5 top-2.5 shadow-sm ${
                      t.accessType === "PREMIUM"
                        ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-[10px] tracking-wider px-2 py-0.5 border-none"
                        : ""
                    }`}
                    variant={
                      t.accessType === "FREE"
                        ? "success"
                        : t.accessType === "PREMIUM"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {t.accessType === "PREMIUM" ? "PRO" : t.accessType}
                  </Badge>
                </div>

                <CardContent className="space-y-2 p-4">
                  {t.category && <p className="text-xs text-muted-foreground truncate">{t.category.name}</p>}
                  <h3 className="line-clamp-1 font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {t.title}
                  </h3>
                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-xs text-muted-foreground">Video Masterclass</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <span>Watch</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
