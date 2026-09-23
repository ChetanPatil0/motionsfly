"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageOff, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductGallery({
  title,
  thumbnail,
  images = [],
}: {
  title: string;
  thumbnail: string | null;
  images: string[];
}) {
  // Combine thumbnail (as primary) with any additional gallery images/GIFs, eliminating duplicates
  const allMedia = Array.from(
    new Set([thumbnail, ...images].filter((item): item is string => !!item && item.trim().length > 0))
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentMedia = allMedia[activeIndex] || "";

  const prev = useCallback(() => {
    setActiveIndex((i) => (i > 0 ? i - 1 : allMedia.length - 1));
  }, [allMedia.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i < allMedia.length - 1 ? i + 1 : 0));
  }, [allMedia.length]);

  // Keyboard navigation for gallery & lightbox
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setIsLightboxOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next]);

  if (allMedia.length === 0) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="h-10 w-10 text-muted-foreground/50" />
          <span className="text-xs">No preview images available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Interactive Preview Container */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-xl border bg-black/5 dark:bg-black/40 shadow-sm transition-all">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentMedia}
          alt={`${title} - preview ${activeIndex + 1}`}
          className="h-full w-full object-contain cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
          onClick={() => setIsLightboxOpen(true)}
        />

        {/* Expand / Lightbox Button */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-3 right-3 rounded-lg bg-black/60 p-2 text-white/90 opacity-0 transition-opacity hover:bg-black/90 hover:text-white group-hover:opacity-100"
          title="Full size view"
          aria-label="Enlarge image"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Counter Pill */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-0.5 font-mono text-[11px] font-medium text-white/90 backdrop-blur">
            {activeIndex + 1} / {allMedia.length}
          </div>
        )}

        {/* Arrow Navigation */}
        {allMedia.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all hover:bg-black/80 hover:scale-110 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all hover:bg-black/80 hover:scale-110 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip for Direct Switching */}
      {allMedia.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {allMedia.map((mediaUrl, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={mediaUrl}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-muted-foreground/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/25"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal Content */}
          <div
            className="relative flex max-h-[90vh] max-w-[95vw] flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentMedia}
              alt={`${title} - enlarged preview`}
              className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
            />

            {/* Modal Bottom Bar */}
            <div className="mt-4 flex items-center gap-4 text-white">
              {allMedia.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prev}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
              )}
              <span className="text-xs font-mono text-white/80">
                {activeIndex + 1} of {allMedia.length}
              </span>
              {allMedia.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={next}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
