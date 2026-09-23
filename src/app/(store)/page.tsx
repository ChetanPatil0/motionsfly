import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import {
  ArrowRight,
  ImageOff,
  Crown,
  Flame,
  Zap,
  ShieldCheck,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  Search,
  Star,
  Gift,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimelineRuler } from "@/components/timeline-ruler";
import { ProductCard } from "@/components/product-card";
import { PromotionalSliderCta } from "@/components/promotional-slider-cta";
import { ScrollReveal } from "@/components/scroll-reveal";
import { HeroPreviewModal } from "@/components/hero-preview-modal";
import { SoftwareCompatibilityBar } from "@/components/software-compatibility-bar";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const user = await getCurrentUser();
  const currencyView = (cookies().get("mf_currency_view")?.value as "INR" | "USD" | undefined) ?? "INR";

  let firstName: string | null = null;
  let hasActiveSubscription = false;
  let recentOrderProductTitle: string | null = null;

  if (user) {
    const userId = (user as { id: string }).id;
    const [dbUser, activeSub, recentItem] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.subscription.findFirst({ where: { userId, status: "ACTIVE" } }),
      prisma.orderItem.findFirst({
        where: { order: { userId, status: "PAID" } },
        orderBy: { createdAt: "desc" },
        select: { itemTitle: true },
      }),
    ]);
    firstName = dbUser?.name?.split(" ")[0] ?? null;
    hasActiveSubscription = !!activeSub;
    recentOrderProductTitle = recentItem?.itemTitle ?? null;
  }

  const [
    productCount,
    tutorialCount,
    categoryCount,
    heroThumbs,
    featuredProducts,
    freeProducts,
    latestProducts,
    featuredTutorials,
    heroSlides,
    settings,
    dbReviews,
  ] = await Promise.all([
    prisma.product.count({ where: { isPublished: true, deletedAt: null } }),
    prisma.tutorial.count({ where: { isPublished: true, deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.product.findMany({
      where: { isPublished: true, deletedAt: null, thumbnail: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, thumbnail: true },
    }),
    prisma.product.findMany({
      where: { isPublished: true, deletedAt: null, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { category: { select: { name: true } }, _count: { select: { likes: true } } },
    }),
    prisma.product.findMany({
      where: { isPublished: true, deletedAt: null, isFree: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { category: { select: { name: true } }, _count: { select: { likes: true } } },
    }),
    prisma.product.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { category: { select: { name: true } }, _count: { select: { likes: true } } },
    }),
    prisma.tutorial.findMany({
      where: { isPublished: true, deletedAt: null, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { category: { select: { name: true } } },
    }),
    prisma.heroSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 5 }),
    prisma.storeSetting.findUnique({ where: { id: "default" } }),
    prisma.review.findMany({
      where: { isHidden: false, deletedAt: null, rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true } },
        product: { select: { title: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-12 sm:space-y-20 pb-20">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. ULTRA-MODERN CINEMATIC HERO SECTION                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-muted/10 to-background pt-6 pb-16 lg:pb-24">
        {/* Dynamic Multi-layered Ambient Light */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[500px] w-[750px] rounded-full bg-primary/15 blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-10 h-80 w-80 rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-10 h-72 w-72 rounded-full bg-purple-500/10 blur-[110px] pointer-events-none" />

        {/* Top Timeline Strip */}
        <div className="container mb-8">
          <TimelineRuler className="h-7 w-full opacity-60 hover:opacity-100 transition-opacity" />
        </div>

        <div className="container grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              <Zap className="h-3.5 w-3.5" />
              <span>Next-Gen Video Assets &amp; NLE Plugins</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-black leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              {firstName ? (
                <>
                  Welcome back, <span className="text-primary">{firstName}</span>.
                  <br />
                  <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    Elevate Your Timeline.
                  </span>
                </>
              ) : settings?.heroTitle ? (
                settings.heroTitle
              ) : (
                <>
                  Cinematic Assets.
                  <br />
                  <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    Built for the Cut.
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {recentOrderProductTitle ? (
                <>
                  Pick up where you left off with <span className="font-semibold text-foreground">{recentOrderProductTitle}</span>,
                  or discover high-end motion graphics, LUTs, and DaVinci plugins freshly published to the library.
                </>
              ) : settings?.heroSubtitle ? (
                settings.heroSubtitle
              ) : (
                "Drag-and-drop motion templates, DaVinci plugins, Premiere presets, sound FX, and color LUTs engineered to ship client-grade edits at record speed."
              )}
            </p>

            {/* Sleek Search Box Directly In Hero */}
            <form action="/products" method="GET" className="relative flex max-w-lg items-center pt-1">
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="q"
                placeholder="Search 500+ DaVinci plugins, Premiere presets, LUTs, SFX..."
                className="h-12 w-full rounded-full border border-border/80 bg-card/80 pl-11 pr-28 text-sm shadow-md backdrop-blur-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              />
              <Button type="submit" size="sm" className="absolute right-1.5 rounded-full px-4 font-semibold shadow">
                Search
              </Button>
            </form>

            {/* Trending Search Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80 flex items-center gap-1 text-[11px]">
                <Sparkles className="h-3 w-3 text-primary" /> Trending:
              </span>
              {[
                { label: "DaVinci Macros", q: "DaVinci" },
                { label: "Film Grain 4K", q: "Film Grain" },
                { label: "LUTs & Color", q: "LUT" },
                { label: "Transitions", q: "Transitions" },
                { label: "Sound FX", q: "Sound" },
              ].map((tag) => (
                <Link
                  key={tag.label}
                  href={`/products?q=${encodeURIComponent(tag.q)}`}
                  className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all"
                >
                  #{tag.label}
                </Link>
              ))}
            </div>

            {/* Quick Action Buttons & Category Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/25" asChild>
                <Link href="/products">
                  <span>Browse All Assets</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!hasActiveSubscription ? (
                <Button size="lg" variant="outline" asChild className="backdrop-blur-sm">
                  <Link href="/subscriptions">All-Access Plans</Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild className="backdrop-blur-sm">
                  <Link href="/tutorials">Watch Tutorials</Link>
                </Button>
              )}
            </div>

            {/* Category Quick Pills */}
            <div className="pt-2">
              <div className="flex flex-wrap gap-2 text-xs">
                {["DaVinci Resolve", "Premiere Pro", "After Effects", "Sound FX", "LUTs & Color"].map((cat) => (
                  <Link
                    key={cat}
                    href={`/products?q=${encodeURIComponent(cat)}`}
                    className="rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all backdrop-blur"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust and Stats Bar */}
            <div className="pt-5 border-t flex flex-wrap items-center gap-6 sm:gap-8 font-mono text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{String(productCount).padStart(2, "0")}+</span> Assets
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{String(tutorialCount).padStart(2, "0")}</span> Masterclasses
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{String(categoryCount).padStart(2, "0")}</span> Categories
              </div>
              <div className="flex items-center gap-1.5 text-primary font-sans font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Commercial License Included
              </div>
            </div>
          </div>

          {/* Right Signature Visual: Interactive NLE Studio Canvas */}
          <div className="relative hidden lg:block">
            <div className="relative w-full rounded-2xl border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden p-3 transition-all hover:border-primary/40">
              {/* Top Studio Frame Window Bar */}
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5 px-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-[11px] font-mono font-medium text-muted-foreground">
                    MotionFly_LivePreview.drp
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-primary/15 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    4K ProRes 4444
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">00:01:48:12</span>
                </div>
              </div>

              {/* Main Video Viewport Canvas with Interactive Modal */}
<HeroPreviewModal
  thumbnailUrl={heroThumbs[0]?.thumbnail ?? null}
  productTitle={heroThumbs[0]?.title ?? "MotionFly Cinematic Suite Showreel"}
/>

              {/* Simulated Multi-Track NLE Timeline Ruler */}
              <div className="mt-3 rounded-lg bg-muted/40 p-2.5 space-y-1.5 font-mono text-[10px]">
                <div className="flex items-center justify-between text-muted-foreground px-1">
                  <span>V1 [Video]</span>
                  <div className="h-1.5 w-48 rounded bg-primary/40" />
                  <span>01:00</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground px-1">
                  <span>A1 [Sound FX]</span>
                  <div className="h-1.5 w-48 rounded bg-emerald-500/40" />
                  <span>Stereo</span>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute -bottom-2 -left-2 z-30 flex items-center gap-2 rounded-xl border border-border/80 bg-card/95 px-3 py-1.5 shadow-xl backdrop-blur-md">
                <div className="rounded-lg bg-emerald-500/20 p-1 text-emerald-500">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold leading-tight">Instant 4K Download</p>
                  <p className="text-[9px] text-muted-foreground">DRM-Free .ZIP File</p>
                </div>
              </div>

              <div className="absolute -top-2 -right-2 z-30 flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/95 px-3 py-1.5 shadow-xl backdrop-blur-md text-[11px] font-semibold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-foreground">4.9/5</span>
                <span className="text-muted-foreground text-[10px]">(12K+ Editors)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Software Compatibility Ecosystem Bar */}
      <SoftwareCompatibilityBar />

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. FEATURED PRODUCTS (STAFF PICKS)                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <ScrollReveal>
          <section className="container">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  <Flame className="h-3 w-3 text-primary" />
                  <span>Hand-Picked Highlights</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Featured Master Assets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Top-rated creative tools selected by MotionFly directors</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs font-medium">
                <Link href="/products?featured=true">
                  <span>View all featured</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} currency={currencyView} />
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2B. DEDICATED FREE STARTER PACKS (NO CARD REQUIRED)         */}
      {/* ─────────────────────────────────────────────────────────── */}
      {freeProducts.length > 0 && (
        <ScrollReveal>
          <section className="container">
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 via-card to-card p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">
                    <Gift className="h-3.5 w-3.5" />
                    <span>Zero Cost &middot; Commercial License Included</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Free Starter Packs &amp; Tools</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Test drive cinema-grade MotionFly quality in your timeline today. No credit card required.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1 text-xs font-medium border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  <Link href="/products?free=true">
                    <span>View all free assets</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {freeProducts.map((p) => (
                  <ProductCard key={p.id} product={p} currency={currencyView} />
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. PROMOTIONAL SLIDER & CTA (IN THE MIDDLE!)               */}
      {/* ─────────────────────────────────────────────────────────── */}
      {heroSlides.length > 0 ? (
        <ScrollReveal>
          <PromotionalSliderCta slides={heroSlides} />
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <section className="container">
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-indigo-950 via-slate-900 to-zinc-950 p-8 sm:p-12 text-white shadow-xl">
              <div className="max-w-xl space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Flame className="h-3 w-3" /> Special Edition
                </span>
                <h3 className="text-3xl font-extrabold sm:text-4xl">Supercharge Your Production Speed</h3>
                <p className="text-sm text-zinc-300">
                  Explore our full library of transition packs, audio sound effects, and color grading LUTs built for tight deadlines.
                </p>
                <div className="pt-2">
                  <Button size="lg" asChild className="font-semibold shadow-lg">
                    <Link href="/products">
                      <span>Explore All Assets</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. WHY CHOOSE MOTIONFLY (VALUE PROPS)                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="container">
          <div className="mb-8 text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Engineered for Video Editors</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to deliver high-converting videos without starting from scratch.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Zap}
              title="One-Click Installation"
              description="Pre-configured drag & drop presets, project templates, and macro plugins for DaVinci Resolve, Premiere & AE."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Commercial License"
              description="Use freely across client projects, YouTube monetization, TV broadcast, and social ads without royalties."
            />
            <FeatureCard
              icon={GraduationCap}
              title="Masterclasses Included"
              description="Every tool comes with step-by-step video tutorials and project breakdowns so you master the techniques."
            />
            <FeatureCard
              icon={RefreshCw}
              title="Lifetime Access & Updates"
              description="Re-download purchased items anytime from your account dashboard with compatibility fixes for new NLE versions."
            />
          </div>
        </section>
      </ScrollReveal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. LATEST IN THE LIBRARY (NEW RELEASES)                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="container">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Fresh Drops This Week</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Newly released presets, plugins, sound FX, and motion templates</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs font-medium">
              <Link href="/products">
                <span>View full catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {latestProducts.length === 0 ? (
            <EmptyLibraryNotice />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestProducts.map((p) => (
                <ProductCard key={p.id} product={p} currency={currencyView} />
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. MASTERCLASS TUTORIALS                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {featuredTutorials.length > 0 && (
        <ScrollReveal>
          <section className="border-y bg-muted/20 py-16">
            <div className="container">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Learn the Craft</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Masterclass Video Tutorials</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Hands-on workflows taught by pro colorists, animators, and video editors
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="gap-1 text-xs font-medium">
                  <Link href="/tutorials">
                    <span>View All Masterclasses</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {featuredTutorials.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tutorials/${t.slug}`}
                    className="group overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {t.thumbnail ? (
                        <Image
                          src={t.thumbnail}
                          alt={t.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-6 w-6" />
                        </div>
                      )}
                      <Badge
                        className="absolute left-2.5 top-2.5 font-semibold text-[10px]"
                        variant={t.accessType === "FREE" ? "success" : "default"}
                      >
                        {t.accessType}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-1">
                      {t.category && <p className="text-xs font-medium text-primary">{t.category.name}</p>}
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. COMMUNITY REVIEWS & SOCIAL PROOF                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="container">
          <div className="mb-8 text-center max-w-xl mx-auto space-y-1">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400" />
              ))}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Trusted by 10,000+ Creators</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              See why video editors, YouTubers, and commercial studios rely on MotionFly assets daily.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {dbReviews.length >= 3 ? (
              dbReviews.slice(0, 3).map((r) => (
                <ReviewCard
                  key={r.id}
                  name={r.user?.name || "Verified Creator"}
                  role="Verified Customer"
                  content={r.content}
                  rating={r.rating}
                  productTitle={r.product?.title}
                />
              ))
            ) : (
              <>
                <ReviewCard
                  name="Alex Turner"
                  role="Commercial Colorist & Editor"
                  content="The DaVinci Resolve color presets and LUTs saved me hours on our latest agency spot. The drag-and-drop workflow is flawless."
                  rating={5}
                  productTitle="Cinematic LUTs Vol. 1"
                />
                <ReviewCard
                  name="Sarah Jenkins"
                  role="YouTube Creator (450K Subs)"
                  content="MotionFly is my secret weapon. The transitions and typography templates keep my weekly uploads looking broadcast-grade without hiring an animator."
                  rating={5}
                  productTitle="Kinetic Typography Physics"
                />
                <ReviewCard
                  name="Devin Miller"
                  role="Lead Motion Designer"
                  content="Top-quality assets that don't bog down playback. The tutorials included with every bundle make onboarding second nature."
                  rating={5}
                  productTitle="Analog Film Grain 4K"
                />
              </>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 8. VIP ALL-ACCESS PASS SUBSCRIPTION BANNER                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {!hasActiveSubscription && (
        <ScrollReveal>
          <section className="container">
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-primary/5 to-card p-8 sm:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500">
                    <Crown className="h-3.5 w-3.5" /> VIP All-Access Pass
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Unlock the Entire Library. Cancel Anytime.
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    One affordable subscription grants instant access to all premium video masterclasses, curated sound libraries, and future release drops.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> All Premium Masterclasses
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Commercial Usage Rights
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> New Releases Added Weekly
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Priority Support &amp; Updates
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                  <Button size="lg" asChild className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/20">
                    <Link href="/subscriptions">
                      <span>Explore All-Access Plans</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function ReviewCard({
  name,
  role,
  content,
  rating = 5,
  productTitle,
}: {
  name: string;
  role: string;
  content: string;
  rating?: number;
  productTitle?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: rating }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
            ))}
          </div>
          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Verified Buyer
          </span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">"{content}"</p>
      </div>

      <div className="pt-3 border-t flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold font-mono shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{name}</p>
            <p className="text-[11px] text-muted-foreground">{role}</p>
          </div>
        </div>
        {productTitle && (
          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[130px] text-right bg-muted/40 px-2 py-0.5 rounded border">
            {productTitle}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyLibraryNotice() {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
      The library is updating right now — check back shortly for fresh drops.
    </div>
  );
}
