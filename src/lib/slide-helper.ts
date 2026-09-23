export type SlideBgPreset =
  | "dark"
  | "gradient-indigo"
  | "gradient-purple"
  | "gradient-emerald"
  | "gradient-amber"
  | "gradient-rose"
  | "custom";

export type SlideHorizontalAlign = "left" | "center" | "right";
export type SlideVerticalAlign = "top" | "center" | "bottom";
export type SlideBtnVariant = "primary" | "gradient" | "outline" | "white";

export interface SlideConfig {
  htmlDescription: string;
  badgeText?: string;
  horizontalAlign: SlideHorizontalAlign;
  verticalAlign: SlideVerticalAlign;
  bgPreset: SlideBgPreset;
  customBgColor?: string;
  textColor?: string;
  btnVariant: SlideBtnVariant;
  overlayOpacity: number; // 0 to 100
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

export interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const BG_PRESET_CLASSES: Record<SlideBgPreset, string> = {
  dark: "bg-zinc-950 text-white",
  "gradient-indigo": "bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 text-white",
  "gradient-purple": "bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white",
  "gradient-emerald": "bg-gradient-to-br from-emerald-950 via-zinc-900 to-slate-950 text-white",
  "gradient-amber": "bg-gradient-to-br from-amber-950/90 via-zinc-900 to-stone-950 text-white",
  "gradient-rose": "bg-gradient-to-br from-rose-950 via-zinc-900 to-indigo-950 text-white",
  custom: "bg-zinc-950 text-white",
};

export function parseSlideSubtitle(rawSubtitle: string | null | undefined): SlideConfig {
  const defaultConfig: SlideConfig = {
    htmlDescription: "",
    badgeText: "",
    horizontalAlign: "left",
    verticalAlign: "bottom",
    bgPreset: "gradient-indigo",
    textColor: "#ffffff",
    btnVariant: "primary",
    overlayOpacity: 55,
    secondaryCtaLabel: "",
    secondaryCtaHref: "",
  };

  if (!rawSubtitle || !rawSubtitle.trim()) {
    return defaultConfig;
  }

  // Check if it is a JSON payload
  if (rawSubtitle.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawSubtitle);
      if (typeof parsed === "object" && parsed !== null) {
        return {
          htmlDescription: parsed.htmlDescription ?? parsed.html ?? "",
          badgeText: parsed.badgeText ?? parsed.badge ?? "",
          horizontalAlign: parsed.horizontalAlign ?? parsed.textPosition ?? "left",
          verticalAlign: parsed.verticalAlign ?? parsed.verticalPosition ?? "bottom",
          bgPreset: parsed.bgPreset ?? "gradient-indigo",
          customBgColor: parsed.customBgColor ?? "",
          textColor: parsed.textColor ?? "#ffffff",
          btnVariant: parsed.btnVariant ?? "primary",
          overlayOpacity: typeof parsed.overlayOpacity === "number" ? parsed.overlayOpacity : 55,
          secondaryCtaLabel: parsed.secondaryCtaLabel ?? "",
          secondaryCtaHref: parsed.secondaryCtaHref ?? "",
        };
      }
    } catch {
      // Fall through to plain text
    }
  }

  // Legacy or plain text string
  return {
    ...defaultConfig,
    htmlDescription: rawSubtitle,
  };
}

export function encodeSlideSubtitle(config: SlideConfig): string {
  return JSON.stringify({
    htmlDescription: config.htmlDescription || "",
    badgeText: config.badgeText || "",
    horizontalAlign: config.horizontalAlign || "left",
    verticalAlign: config.verticalAlign || "bottom",
    bgPreset: config.bgPreset || "gradient-indigo",
    customBgColor: config.customBgColor || "",
    textColor: config.textColor || "#ffffff",
    btnVariant: config.btnVariant || "primary",
    overlayOpacity: typeof config.overlayOpacity === "number" ? config.overlayOpacity : 55,
    secondaryCtaLabel: config.secondaryCtaLabel || "",
    secondaryCtaHref: config.secondaryCtaHref || "",
  });
}
