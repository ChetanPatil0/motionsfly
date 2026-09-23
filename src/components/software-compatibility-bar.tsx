import Link from "next/link";
import { Film, Sparkles, Layers, Sliders, Volume2, ArrowRight } from "lucide-react";

interface SoftwareItem {
  name: string;
  query: string;
  tagline: string;
  icon: typeof Film;
  badge: string;
}

const SOFTWARE_LIST: SoftwareItem[] = [
  {
    name: "DaVinci Resolve",
    query: "DaVinci",
    tagline: "Fusion Macros & PowerGrades",
    icon: Sliders,
    badge: "v18 & 19 Ready",
  },
  {
    name: "Premiere Pro",
    query: "Premiere",
    tagline: "MOGRT & Effect Presets",
    icon: Film,
    badge: "CC 2024+",
  },
  {
    name: "After Effects",
    query: "After Effects",
    tagline: "Kinetic Motion & VFX",
    icon: Layers,
    badge: "Pre-rendered 4K",
  },
  {
    name: "Final Cut Pro",
    query: "Final Cut",
    tagline: "FCPX Titles & Transitions",
    icon: Sparkles,
    badge: "Apple Silicon",
  },
  {
    name: "Sound Design & SFX",
    query: "Sound",
    tagline: "96kHz 24-bit Master WAV",
    icon: Volume2,
    badge: "Royalty-Free",
  },
];

export function SoftwareCompatibilityBar() {
  return (
    <section className="container py-4">
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Filter by Your Editing Suite
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            100% Native Integration &middot; Drag &amp; Drop
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {SOFTWARE_LIST.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={`/products?q=${encodeURIComponent(item.query)}`}
                className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-background/80 p-3.5 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] font-mono font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{item.name}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {item.tagline}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
