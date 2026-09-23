"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Zap, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  parseSlideSubtitle,
  BG_PRESET_CLASSES,
  type Slide,
  type SlideConfig,
} from "@/lib/slide-helper";
import { cn } from "@/lib/utils";

interface PromotionalSliderCtaProps {
  slides: Slide[];
  autoPlayIntervalMs?: number;
  className?: string;
}

export function PromotionalSliderCta({
  slides,
  autoPlayIntervalMs = 6000,
  className,
}: PromotionalSliderCtaProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeSlides = slides.filter((s) => s.isActive !== false);

  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeSlides.length);
    }, autoPlayIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSlides.length, isPaused, autoPlayIntervalMs, index]);

  if (activeSlides.length === 0) {
    return null;
  }

  const slide = activeSlides[index] || activeSlides[0];
  if (!slide) return null;

  const config: SlideConfig = parseSlideSubtitle(slide.subtitle);

  // Alignment classes mapping
  const horizontalMap = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto",
  };

  const verticalMap = {
    top: "justify-start pt-10 sm:pt-14",
    center: "justify-center py-10 sm:py-12",
    bottom: "justify-end pb-12 sm:pb-16",
  };

  const bgClass =
    config.bgPreset === "custom" && config.customBgColor
      ? ""
      : BG_PRESET_CLASSES[config.bgPreset] || BG_PRESET_CLASSES["gradient-indigo"];

  const customStyle: React.CSSProperties = {
    backgroundColor:
      config.bgPreset === "custom" && config.customBgColor ? config.customBgColor : undefined,
    color: config.textColor || "#ffffff",
  };

  const overlayOpacityPct = (config.overlayOpacity ?? 55) / 100;

  return (
    <section className={cn("container py-12 md:py-16", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Featured Spotlight & Special Offers
          </h2>
        </div>
        {activeSlides.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {index + 1} / {activeSlides.length}
            </span>
          </div>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-border/80 shadow-2xl transition-all"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={customStyle}
      >
        {/* Slide Visual Container */}
        <div className={cn("relative min-h-[440px] sm:min-h-[480px] md:min-h-[520px] w-full overflow-hidden", bgClass)}>
          {/* Background Image if uploaded */}
          {slide.imageUrl && (
            <div className="absolute inset-0 z-0 transition-opacity duration-700">
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                className="object-cover object-center transform transition-transform duration-1000 ease-out scale-105"
                priority
              />
            </div>
          )}

          {/* Dynamic Contrast & Tint Overlay */}
          <div
            className="absolute inset-0 z-10 transition-colors duration-500 pointer-events-none"
            style={{
              backgroundColor: `rgba(10, 10, 15, ${overlayOpacityPct})`,
            }}
          />

          {/* Gradient Lighting accents */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/95 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          {/* Slide Text Content Container */}
          <div
            className={cn(
              "container relative z-20 flex h-full min-h-[440px] sm:min-h-[480px] md:min-h-[520px] flex-col px-6 sm:px-12 md:px-16",
              verticalMap[config.verticalAlign || "bottom"]
            )}
          >
            <div className={cn("flex flex-col max-w-2xl space-y-4", horizontalMap[config.horizontalAlign || "left"])}>
              {/* Optional Promotional Eyebrow Badge */}
              {config.badgeText && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur-md">
                  <Zap className="h-3 w-3" />
                  <span>{config.badgeText}</span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-[1.1] drop-shadow-md">
                {slide.title}
              </h3>

              {/* Rich HTML Subtitle / Description */}
              {config.htmlDescription && (
                <div
                  className={cn(
                    "text-sm sm:text-base opacity-90 leading-relaxed font-normal max-w-xl drop-shadow",
                    "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_a]:font-medium hover:[&_a]:opacity-80 [&_strong]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold"
                  )}
                  dangerouslySetInnerHTML={{ __html: config.htmlDescription }}
                />
              )}

              {/* CTA Action Buttons */}
              <div
                className={cn(
                  "pt-3 flex flex-wrap items-center gap-3",
                  config.horizontalAlign === "center"
                    ? "justify-center"
                    : config.horizontalAlign === "right"
                    ? "justify-end"
                    : "justify-start"
                )}
              >
                {slide.ctaLabel && slide.ctaHref && (
                  <Button
                    size="lg"
                    asChild
                    className={cn(
                      "font-semibold shadow-lg transition-transform active:scale-95",
                      config.btnVariant === "gradient" &&
                        "bg-gradient-to-r from-primary via-indigo-500 to-purple-600 text-white border-0 hover:opacity-90 shadow-primary/25",
                      config.btnVariant === "white" &&
                        "bg-white text-zinc-950 hover:bg-zinc-100 border-0",
                      config.btnVariant === "outline" &&
                        "border-white/40 bg-black/40 text-white hover:bg-white/20 backdrop-blur"
                    )}
                  >
                    <Link href={slide.ctaHref}>
                      <span>{slide.ctaLabel}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                {config.secondaryCtaLabel && config.secondaryCtaHref && (
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-white/30 bg-black/30 text-white hover:bg-white/10 backdrop-blur"
                  >
                    <Link href={config.secondaryCtaHref}>
                      <span>{config.secondaryCtaLabel}</span>
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-70" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls (Only if multiple slides) */}
          {activeSlides.length > 1 && (
            <>
              {/* Prev Button */}
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + activeSlides.length) % activeSlides.length)}
                aria-label="Previous promotional slide"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white border border-white/20 backdrop-blur-md transition-all hover:bg-black/70 hover:scale-110 active:scale-95 shadow-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % activeSlides.length)}
                aria-label="Next promotional slide"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white border border-white/20 backdrop-blur-md transition-all hover:bg-black/70 hover:scale-110 active:scale-95 shadow-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Modern Segmented Progress Indicators */}
              <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md border border-white/10">
                {activeSlides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Go to promotional slide ${i + 1}`}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === index
                        ? "w-7 bg-primary shadow-sm shadow-primary"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
