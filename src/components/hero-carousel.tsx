"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  if (!slide) return null;

  return (
    <div className="relative h-[420px] overflow-hidden sm:h-[480px]">
      {slide.imageUrl ? (
        <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" priority />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

      <div className="container relative flex h-full flex-col justify-end pb-16">
        <h1 className="max-w-xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{slide.title}</h1>
        {slide.subtitle && <p className="mt-4 max-w-md text-muted-foreground">{slide.subtitle}</p>}
        {slide.ctaLabel && slide.ctaHref && (
          <Button size="lg" className="mt-6 w-fit" asChild>
            <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
          </Button>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-signal" : "w-1.5 bg-muted-foreground/40")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
