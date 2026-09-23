"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GalleryHorizontal,
  Plus,
  Trash2,
  ImagePlus,
  Edit2,
  Zap,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Maximize2,
  X,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  parseSlideSubtitle,
  encodeSlideSubtitle,
  BG_PRESET_CLASSES,
  type Slide,
  type SlideConfig,
  type SlideBgPreset,
  type SlideHorizontalAlign,
  type SlideVerticalAlign,
  type SlideBtnVariant,
} from "@/lib/slide-helper";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";

async function fetchSlides(): Promise<{ data: Slide[] }> {
  const res = await fetch("/api/hero-slides?scope=admin");
  return res.json();
}

export function HeroSlidesManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [htmlDescription, setHtmlDescription] = useState("");
  const [horizontalAlign, setHorizontalAlign] = useState<SlideHorizontalAlign>("left");
  const [verticalAlign, setVerticalAlign] = useState<SlideVerticalAlign>("bottom");
  const [bgPreset, setBgPreset] = useState<SlideBgPreset>("gradient-indigo");
  const [customBgColor, setCustomBgColor] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [btnVariant, setBtnVariant] = useState<SlideBtnVariant>("primary");
  const [overlayOpacity, setOverlayOpacity] = useState(55);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState("");
  const [secondaryCtaHref, setSecondaryCtaHref] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["hero-slides"], queryFn: fetchSlides });

  function resetForm() {
    setTitle("");
    setBadgeText("");
    setHtmlDescription("");
    setHorizontalAlign("left");
    setVerticalAlign("bottom");
    setBgPreset("gradient-indigo");
    setCustomBgColor("");
    setTextColor("#ffffff");
    setBtnVariant("primary");
    setOverlayOpacity(55);
    setCtaLabel("");
    setCtaHref("");
    setSecondaryCtaLabel("");
    setSecondaryCtaHref("");
    setImageUrl(null);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(slide: Slide) {
    const config = parseSlideSubtitle(slide.subtitle);
    setEditingId(slide.id);
    setTitle(slide.title);
    setBadgeText(config.badgeText || "");
    setHtmlDescription(config.htmlDescription || "");
    setHorizontalAlign(config.horizontalAlign || "left");
    setVerticalAlign(config.verticalAlign || "bottom");
    setBgPreset(config.bgPreset || "gradient-indigo");
    setCustomBgColor(config.customBgColor || "");
    setTextColor(config.textColor || "#ffffff");
    setBtnVariant(config.btnVariant || "primary");
    setOverlayOpacity(config.overlayOpacity ?? 55);
    setCtaLabel(slide.ctaLabel || "");
    setCtaHref(slide.ctaHref || "");
    setSecondaryCtaLabel(config.secondaryCtaLabel || "");
    setSecondaryCtaHref(config.secondaryCtaHref || "");
    setImageUrl(slide.imageUrl);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const encodedSubtitle = encodeSlideSubtitle({
        htmlDescription,
        badgeText,
        horizontalAlign,
        verticalAlign,
        bgPreset,
        customBgColor,
        textColor,
        btnVariant,
        overlayOpacity,
        secondaryCtaLabel,
        secondaryCtaHref,
      });

      const payload = {
        title,
        subtitle: encodedSubtitle,
        ctaLabel: ctaLabel || undefined,
        ctaHref: ctaHref || undefined,
      };

      if (editingId) {
        const res = await fetch(`/api/hero-slides/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return res.json();
      } else {
        const res = await fetch("/api/hero-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, sortOrder: data?.data.length ?? 0 }),
        });
        return res.json();
      }
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to save slide.");
        return;
      }
      toast.success(editingId ? "Slide updated successfully." : "Slide created successfully.");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/hero-slides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hero-slides"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hero-slides/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Slide deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });

  const slides = data?.data ?? [];
  const atLimit = slides.length >= 5 && !editingId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promotional Slider & CTA</h1>
          <p className="text-sm text-muted-foreground">
            Customizable spotlight slider shown in the middle of the homepage ({slides.length}/5 used).
          </p>
        </div>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} disabled={atLimit} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Create Promo Slide
          </Button>
        ) : (
          <Button variant="outline" onClick={resetForm} className="gap-2 shrink-0">
            <X className="h-4 w-4" /> Cancel
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {editingId ? "Edit Promotional Slide" : "New Promotional Slide"}
                </CardTitle>
                <CardDescription>
                  Full control over typography, colors, rich description, text alignment, and buttons.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Live Interactive Preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <Label className="font-semibold text-sm">Live Visual Preview (Homepage Render)</Label>
              </div>
              <div
                className={cn(
                  "relative w-full min-h-[300px] rounded-xl overflow-hidden border p-6 flex flex-col justify-end transition-all shadow-md",
                  bgPreset === "custom" && customBgColor ? "" : BG_PRESET_CLASSES[bgPreset]
                )}
                style={{
                  backgroundColor: bgPreset === "custom" && customBgColor ? customBgColor : undefined,
                  color: textColor || "#ffffff",
                }}
              >
                {imageUrl && (
                  <div className="absolute inset-0 z-0">
                    <Image src={imageUrl} alt="Slide preview" fill className="object-cover" />
                  </div>
                )}
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{ backgroundColor: `rgba(10, 10, 15, ${overlayOpacity / 100})` }}
                />
                <div
                  className={cn(
                    "relative z-20 flex flex-col space-y-3 max-w-xl",
                    horizontalAlign === "center"
                      ? "text-center items-center mx-auto"
                      : horizontalAlign === "right"
                      ? "text-right items-end ml-auto"
                      : "text-left items-start"
                  )}
                >
                  {badgeText && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-primary/40 bg-primary/20 text-primary">
                      <Zap className="h-3 w-3" /> {badgeText}
                    </span>
                  )}
                  <h4 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                    {title || "Supercharge Your Edits"}
                  </h4>
                  {htmlDescription ? (
                    <div
                      className="text-xs sm:text-sm opacity-90 leading-relaxed max-w-md"
                      dangerouslySetInnerHTML={{ __html: htmlDescription }}
                    />
                  ) : (
                    <p className="text-xs sm:text-sm opacity-80">
                      Over 500+ drag & drop transition presets, cinematic LUTs, and masterclass tutorials.
                    </p>
                  )}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {ctaLabel ? (
                      <span
                        className={cn(
                          "px-4 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1 shadow",
                          btnVariant === "gradient"
                            ? "bg-gradient-to-r from-primary to-purple-600 text-white"
                            : btnVariant === "white"
                            ? "bg-white text-zinc-950"
                            : btnVariant === "outline"
                            ? "border border-white/40 bg-black/40 text-white"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {ctaLabel}
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground shadow">
                        Browse Assets
                      </span>
                    )}
                    {secondaryCtaLabel && (
                      <span className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-white/30 bg-black/30 text-white">
                        {secondaryCtaLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Slide Configuration Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Title & Badge */}
              <div className="space-y-2">
                <Label htmlFor="slide-title">Slide Title *</Label>
                <Input
                  id="slide-title"
                  value={title}
                  placeholder="e.g. 50% Off Lifetime All-Access"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slide-badge">Eyebrow / Badge Pill Tag (Optional)</Label>
                <Input
                  id="slide-badge"
                  value={badgeText}
                  placeholder="e.g. ⚡ LIMITED TIME OFFER or 🔥 TRENDING"
                  onChange={(e) => setBadgeText(e.target.value)}
                />
              </div>

              {/* Rich Text Description */}
              <div className="md:col-span-2 space-y-2">
                <Label>Rich Subtitle / Description (WYSIWYG Editor)</Label>
                <p className="text-xs text-muted-foreground">
                  Use bold, lists, headings, and links to craft a compelling promotion or feature list.
                </p>
                <RichTextEditor
                  value={htmlDescription}
                  onChange={setHtmlDescription}
                  placeholder="Write promotional bullet points, benefits, or announcement details..."
                  minHeight="180px"
                />
              </div>

              {/* Text Alignment & Vertical Placement */}
              <div className="space-y-2">
                <Label>Horizontal Text Alignment</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["left", "center", "right"] as const).map((align) => (
                    <Button
                      key={align}
                      type="button"
                      variant={horizontalAlign === align ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHorizontalAlign(align)}
                      className="capitalize text-xs gap-1.5"
                    >
                      {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                      {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                      {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                      {align}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vertical Text Position</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["top", "center", "bottom"] as const).map((valign) => (
                    <Button
                      key={valign}
                      type="button"
                      variant={verticalAlign === valign ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVerticalAlign(valign)}
                      className="capitalize text-xs gap-1.5"
                    >
                      {valign === "top" && <ArrowUp className="h-3.5 w-3.5" />}
                      {valign === "center" && <Maximize2 className="h-3.5 w-3.5" />}
                      {valign === "bottom" && <ArrowDown className="h-3.5 w-3.5" />}
                      {valign}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Background Theme Presets */}
              <div className="space-y-2">
                <Label>Background Preset & Style</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: "gradient-indigo", label: "Indigo Glow" },
                    { key: "gradient-purple", label: "Neon Purple" },
                    { key: "gradient-emerald", label: "Cyber Emerald" },
                    { key: "gradient-amber", label: "Amber Sunset" },
                    { key: "dark", label: "Deep Slate" },
                    { key: "custom", label: "Custom Hex" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setBgPreset(p.key as SlideBgPreset)}
                      className={cn(
                        "rounded-lg border p-2 font-medium transition-all text-left",
                        bgPreset === p.key
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                          : "border-border hover:bg-muted/40"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {bgPreset === "custom" && (
                  <div className="pt-2">
                    <Input
                      placeholder="#1e1b4b or rgb(30, 27, 75)"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Button Style & Overlay Opacity */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Button Style Variant</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(["primary", "gradient", "outline", "white"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setBtnVariant(v)}
                        className={cn(
                          "rounded-lg border p-2 font-medium capitalize text-left transition-all",
                          btnVariant === v
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        {v} Button
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="text-xs">Overlay Dark Contrast Opacity</Label>
                    <span className="font-mono text-muted-foreground">{overlayOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Primary CTA */}
              <div className="space-y-2">
                <Label htmlFor="cta-label">Primary Button Text</Label>
                <Input
                  id="cta-label"
                  value={ctaLabel}
                  placeholder="e.g. Shop Bundle Now"
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta-href">Primary Button Link</Label>
                <Input
                  id="cta-href"
                  value={ctaHref}
                  placeholder="/products or /subscriptions"
                  onChange={(e) => setCtaHref(e.target.value)}
                />
              </div>

              {/* Secondary CTA */}
              <div className="space-y-2">
                <Label htmlFor="sec-cta-label">Secondary Button Text (Optional)</Label>
                <Input
                  id="sec-cta-label"
                  value={secondaryCtaLabel}
                  placeholder="e.g. Learn More or See Demo"
                  onChange={(e) => setSecondaryCtaLabel(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sec-cta-href">Secondary Button Link (Optional)</Label>
                <Input
                  id="sec-cta-href"
                  value={secondaryCtaHref}
                  placeholder="/tutorials"
                  onChange={(e) => setSecondaryCtaHref(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!title.trim() || saveMutation.isPending}
                isLoading={saveMutation.isPending}
                loadingText="Saving Slide..."
                onClick={() => saveMutation.mutate()}
              >
                {editingId ? "Update Slide" : "Create Promo Slide"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slide List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <EmptyState
          icon={GalleryHorizontal}
          title="No Promotional Slides Yet"
          description="Add up to 5 promotional slides to highlight special sales, new bundle releases, or featured tutorials."
          action={
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create First Slide
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <SlideRow
              key={slide.id}
              slide={slide}
              onEdit={() => startEdit(slide)}
              onToggle={(isActive) => toggleMutation.mutate({ id: slide.id, isActive })}
              onDelete={() => deleteMutation.mutate(slide.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlideRow({
  slide,
  onEdit,
  onToggle,
  onDelete,
}: {
  slide: Slide;
  onEdit: () => void;
  onToggle: (isActive: boolean) => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const config = parseSlideSubtitle(slide.subtitle);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/hero-slides/${slide.id}/image`, { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Upload failed.");
        return;
      }
      toast.success("Slide image updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Card className="overflow-hidden transition-all hover:border-primary/40 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border bg-muted shadow-inner">
              {slide.imageUrl ? (
                <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-xs font-medium">
                  <ImagePlus className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm leading-tight text-foreground">{slide.title}</h3>
                {config.badgeText && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {config.badgeText}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Align: <span className="font-medium text-foreground">{config.horizontalAlign}</span> &middot; Theme:{" "}
                <span className="font-medium text-foreground">{config.bgPreset}</span>
                {slide.ctaLabel ? ` &middot; CTA: ${slide.ctaLabel}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              isLoading={isUploading}
              onClick={() => inputRef.current?.click()}
              className="text-xs h-8"
            >
              {slide.imageUrl ? "Change Image" : "Upload Image"}
            </Button>

            <Button variant="outline" size="sm" onClick={onEdit} className="text-xs h-8 gap-1">
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>

            <div className="flex items-center gap-1 pl-2 border-l">
              <Switch checked={slide.isActive} onCheckedChange={onToggle} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteModal(true)}
                aria-label="Delete slide"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          onDelete();
        }}
        title="Delete Promotional Slide?"
        description="This promotional slide and its associated uploaded image will be permanently removed from the store and database."
        confirmText="Delete Slide"
        variant="destructive"
      />
    </>
  );
}
