"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, X, Zap, Volume2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HeroPreviewModalProps {
  thumbnailUrl?: string | null;
  productTitle?: string;
  videoEmbedUrl?: string;
}

export function HeroPreviewModal({
  thumbnailUrl,
  productTitle = "MotionFly Cinematic Suite Showreel",
  videoEmbedUrl = "https://www.youtube-nocookie.com/embed/kYvM-Zlh530?autoplay=1&rel=0&modestbranding=1",
}: HeroPreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Clickable Interactive Canvas Viewport */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="group relative aspect-video w-full cursor-pointer rounded-xl overflow-hidden bg-black shadow-inner focus:outline-none focus:ring-2 focus:ring-primary select-none"
        aria-label="Play MotionFly Showreel"
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={productTitle}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-muted-foreground">
            <span className="text-xs font-mono">MotionFly 4K Reel</span>
          </div>
        )}

        {/* Video Contrast Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 group-hover:from-black/75 transition-colors" />

        {/* Center Animated Play Icon with Pulsing Halo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="relative">
            <span className="absolute -inset-2 rounded-full bg-primary/30 blur-md animate-pulse group-hover:bg-primary/50" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/60 backdrop-blur transition-all duration-300 group-hover:scale-115">
              <Play className="h-6 w-6 fill-current translate-x-0.5" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur transition-all group-hover:border-primary/50 group-hover:text-white">
            Click to Watch Showreel
          </span>
        </div>

        {/* Bottom Canvas Title Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="font-semibold truncate max-w-[240px] drop-shadow">
            {productTitle}
          </span>
          <span className="text-[10px] font-mono text-zinc-300 bg-black/70 px-2 py-0.5 rounded border border-white/10 backdrop-blur flex items-center gap-1">
            <Volume2 className="h-3 w-3 text-primary" /> 4K &middot; 60 FPS
          </span>
        </div>
      </div>

      {/* Cinema Lightbox Reel Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-zinc-800 text-white sm:rounded-2xl">
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <DialogTitle className="text-xs font-mono font-medium text-zinc-300">
                MotionFly 4K Production Suite &middot; Official Reel
              </DialogTitle>
            </div>
          </div>

          <div className="relative aspect-video w-full bg-black">
            {isOpen && (
              <iframe
                src={videoEmbedUrl}
                title="MotionFly Showreel"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}
          </div>

          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Includes DaVinci Resolve, Premiere Pro &amp; After Effects assets</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white"
                onClick={() => setIsOpen(false)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
