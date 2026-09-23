import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const IMG = (seed: string, w = 1200, h = 675) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=${w}&q=80`;

// Curated high-res Unsplash photography for stunning film/motion/vfx themes
const IMAGES = {
  hero1: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1600&q=80",
  hero2: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1600&q=80",
  hero3: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1600&q=80",
  glitch: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
  luts: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
  typography: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  plugin: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
  sound: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
  project: "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=800&q=80",
  filmGrain: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
  starter: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
  cyberpunk: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
  tutorialColor: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
  tutorialSpeed: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
  tutorialSound: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
  tutorialTypography: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
};

export async function resetAndSeedDatabase() {
  console.log("▶ Cleaning all existing database records...");

  // 1. Delete dependent child tables in reverse dependency order
  await prisma.couponUsage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productLike.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.download.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.offerProduct.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.productFile.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tutorial.deleteMany();
  await prisma.category.deleteMany();
  await prisma.heroSlide.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.user.deleteMany();

  console.log("✔ Old data wiped cleanly.");

  // 2. Ensure Store Settings
  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {
      storeName: "MotionFly",
      storeEmail: "contact@motionfly.dev",
      supportEmail: "support@motionfly.dev",
      storeActive: true,
      isMaintenance: false,
      razorpayEnabled: true,
      stripeEnabled: true,
      paypalEnabled: true,
      subscriptionsEnabled: true,
      heroTitle: "Cinema-Grade Assets for Master Editors.",
      heroSubtitle: "Curated motion design templates, kinetic typography engines, film LUTs, and masterclasses.",
      footerText: "MotionFly — Precision motion tools engineered for modern creators.",
      instagramUrl: "https://instagram.com",
      youtubeUrl: "https://youtube.com",
      twitterUrl: "https://x.com",
    },
    create: {
      id: "default",
      storeName: "MotionFly",
      storeEmail: "contact@motionfly.dev",
      supportEmail: "support@motionfly.dev",
      storeActive: true,
      isMaintenance: false,
      razorpayEnabled: true,
      stripeEnabled: true,
      paypalEnabled: true,
      subscriptionsEnabled: true,
      heroTitle: "Cinema-Grade Assets for Master Editors.",
      heroSubtitle: "Curated motion design templates, kinetic typography engines, film LUTs, and masterclasses.",
      footerText: "MotionFly — Precision motion tools engineered for modern creators.",
      instagramUrl: "https://instagram.com",
      youtubeUrl: "https://youtube.com",
      twitterUrl: "https://x.com",
    },
  });

  // 3. Hero Slides
  const heroSlides = [
    {
      title: "Motion Graphics, Supercharged",
      subtitle: "Unleash high-framerate transitions, kinetic typography, and Hollywood-grade LUT packs.",
      imageUrl: IMAGES.hero1,
      ctaLabel: "Explore All Assets",
      ctaHref: "/products",
      sortOrder: 1,
      isActive: true,
    },
    {
      title: "MotionFly PRO Membership",
      subtitle: "Unlimited zero-cost downloads of every asset plus exclusive 4K masterclasses.",
      imageUrl: IMAGES.hero2,
      ctaLabel: "Unlock PRO Membership",
      ctaHref: "/subscriptions",
      sortOrder: 2,
      isActive: true,
    },
    {
      title: "Masterclass Video Tutorials",
      subtitle: "Learn advanced color grading, optical flow, and physics-based animation workflows.",
      imageUrl: IMAGES.hero3,
      ctaLabel: "Watch Tutorials",
      ctaHref: "/tutorials",
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const slide of heroSlides) {
    await prisma.heroSlide.create({ data: slide });
  }

  // 4. Categories
  const categoryDefs = [
    { name: "Transitions", slug: "transitions", description: "Seamless whip pans, zooms, glitches, and match cuts." },
    { name: "Color Grading & LUTs", slug: "color-grading", description: "Film emulation, teal-and-orange, and HDR tone mapping LUTs." },
    { name: "Titles & Typography", slug: "titles-graphics", description: "Minimal lower thirds, kinetic titles, and cinematic credit rolls." },
    { name: "Sound Design", slug: "sound-design", description: "Spatial whooshes, cinematic impacts, and atmospheric audio risers." },
    { name: "Plugins & Scripts", slug: "plugins", description: "Workflow automation plugins and physics-based generator engines." },
    { name: "Project Files", slug: "project-files", description: "Ready-to-render modular projects for Premiere, Resolve, and FCPX." },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoryDefs) {
    const cat = await prisma.category.create({ data: c });
    categories[c.slug] = cat.id;
  }

  // 5. Subscription Plans
  const monthlyPlan = await prisma.subscriptionPlan.create({
    data: {
      id: "seed-plan-monthly",
      name: "MotionFly PRO Monthly",
      description: "Full unlimited access to all premium assets, LUTs, and tutorials. Cancel anytime.",
      priceINR: 199900, // ₹1,999 / mo
      priceUSD: 2499,   // $24.99 / mo
      billingInterval: "MONTHLY",
      isActive: true,
    },
  });

  const yearlyPlan = await prisma.subscriptionPlan.create({
    data: {
      id: "seed-plan-yearly",
      name: "MotionFly PRO Yearly",
      description: "Save over 40% with annual billing. Complete unlimited downloads and priority support.",
      priceINR: 1499900, // ₹14,999 / yr
      priceUSD: 17999,   // $179.99 / yr
      billingInterval: "YEARLY",
      isActive: true,
    },
  });

  // 6. Products
  const productDefs = [
    {
      slug: "glitch-transitions-pack",
      title: "Glitch Transitions Master Pack",
      shortDescription: "40 high-energy digital glitch, RGB split, and datamosh transitions.",
      description:
        "Engineered for fast-paced edits, music videos, and commercial promos. Includes 40 drag-and-drop transitions with audio cues, chromatic aberration, and modular speed controls.",
      type: "TEMPLATE" as const,
      categorySlug: "transitions",
      priceINR: 149900,
      priceUSD: 1999,
      isFree: false,
      isPremium: false,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.glitch,
      images: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnphOHFvOW5qYjdpdnV5eHhkMHpvZTFqcTRsc3RrcHRoYjNuNDdhaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aD2saalBwwftBIY/giphy.gif",
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      slug: "cinematic-teal-orange-luts",
      title: "Cinematic 35mm Film LUTs Collection",
      shortDescription: "16 authentic color grading LUTs calibrated for Arri, RED, Sony, and Blackmagic.",
      description:
        "Give your digital footage the organic texture, rich shadows, and protected skin tones of classic Kodak 2383 and modern teal-and-orange Hollywood palettes. Includes .CUBE files for all NLEs.",
      type: "LUT" as const,
      categorySlug: "color-grading",
      priceINR: 249900,
      priceUSD: 2999,
      isFree: false,
      isPremium: true,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.luts,
      images: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmNqaTZ4c2Jmdnd5Y2R3ZDNldzVqd3Noc2Z6Z21iZ2ZlOG4xdWd6bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgzoKnwFNmISR8I/giphy.gif",
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      slug: "dynamic-text-animator-plugin",
      title: "Kinetic Typography Physics Engine",
      shortDescription: "Pro plugin for spring-based bounce, cascade, and fluid text animations.",
      description:
        "Stop wasting hours keyframing lower thirds and titles. Our physics engine calculates organic damping, inertia, and overshoot automatically with real-time viewport preview.",
      type: "PLUGIN" as const,
      categorySlug: "plugins",
      priceINR: 399900,
      priceUSD: 4999,
      isFree: false,
      isPremium: true,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.plugin,
      images: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjhpbjRocnl6eWlnNGJ2ZDNkOXNuN2o2ZnBsNWs4b2N0eDlyODRoaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPnAiaMCws8nOsE/giphy.gif",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      slug: "minimal-lower-thirds-kit",
      title: "Minimal Studio Lower Thirds & Overlays",
      shortDescription: "24 sleek, responsive lower-third titles with automatic box resize.",
      description:
        "Clean, corporate and documentary-ready typography packages. Text boxes dynamically resize as you type, with full font, color, and positioning controls.",
      type: "TEMPLATE" as const,
      categorySlug: "titles-graphics",
      priceINR: 99900,
      priceUSD: 1499,
      isFree: false,
      isPremium: false,
      isPublished: true,
      isFeatured: false,
      thumbnail: IMAGES.typography,
      images: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqenptcnQzaHJldXZrbXlycTZ2ejlzYXRnZWRvaDNhMm5qOHpiZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tn33aiTi1jkl6H6/giphy.gif",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      slug: "whoosh-and-impact-sfx-library",
      title: "Whoosh & Impact SFX Library (24-bit/48kHz)",
      shortDescription: "180 sound designer elements: cinematic risers, sub drops, and mechanical swooshes.",
      description:
        "Every motion cut needs physical impact. Recorded in a professional Foley studio, this 180-sound library delivers deep bass hits, air whooshes, and tape stop FX.",
      type: "OTHER" as const,
      categorySlug: "sound-design",
      priceINR: 129900,
      priceUSD: 1699,
      isFree: false,
      isPremium: false,
      isPublished: true,
      isFeatured: false,
      thumbnail: IMAGES.sound,
      images: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXN6MHJpcnpiMnFia3BvOXc3dzVqaDFmNTZ6cjJ0bDNpdXg0NXo0aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l378c0402U4NXXIrS/giphy.gif",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      slug: "free-starter-transitions-kit",
      title: "Starter Film Transitions Kit (Free)",
      shortDescription: "12 essential whip pans, camera zooms, and film burns — 100% free.",
      description:
        "Get started with MotionFly at zero cost. Download 12 essential timeline transitions with included sound effects and quick-install guides.",
      type: "TEMPLATE" as const,
      categorySlug: "transitions",
      priceINR: 0,
      priceUSD: 0,
      isFree: true,
      isPremium: false,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.starter,
      images: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnphOHFvOW5qYjdpdnV5eHhkMHpvZTFqcTRsc3RrcHRoYjNuNDdhaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aD2saalBwwftBIY/giphy.gif",
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      slug: "vintage-16mm-film-grain-overlays",
      title: "Vintage 16mm & 35mm Real Film Grain",
      shortDescription: "8 ProRes 4K authentic film grain loops with halation and dust textures.",
      description:
        "Scanned from real Kodak 500T 16mm and 35mm negative stock in uncompressed 4K. Simply set your blend mode to Overlay or Soft Light for instant analog warmth.",
      type: "PRESET" as const,
      categorySlug: "color-grading",
      priceINR: 179900,
      priceUSD: 2199,
      isFree: false,
      isPremium: false,
      isPublished: true,
      isFeatured: false,
      thumbnail: IMAGES.filmGrain,
      images: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtobG0za3g0MmdhZTVtdDN1bWNpYnFzMjFhM3Jrbmd4aDdkYjB2ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlTy9x8FxBtVDAA/giphy.gif",
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      slug: "cyberpunk-hud-ui-elements",
      title: "Cyberpunk Futuristic HUD Graphics Kit",
      shortDescription: "60+ modular holographic UI elements, grids, targets, and dials in 4K.",
      description:
        "Futuristic sci-fi overlays and heads-up display graphics. Includes looping animated circles, coordinate trackers, audio visualizers, and digital warning banners.",
      type: "OTHER" as const,
      categorySlug: "titles-graphics",
      priceINR: 199900,
      priceUSD: 2499,
      isFree: false,
      isPremium: true,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.cyberpunk,
      images: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqenptcnQzaHJldXZrbXlycTZ2ejlzYXRnZWRvaDNhMm5qOHpiZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tn33aiTi1jkl6H6/giphy.gif",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ];

  const products: Record<string, any> = {};
  for (const p of productDefs) {
    const { categorySlug, ...data } = p;
    const prod = await prisma.product.create({
      data: {
        ...data,
        categoryId: categories[categorySlug],
      },
    });
    products[p.slug] = prod;

    // Attach downloadable mock asset file
    await prisma.productFile.create({
      data: {
        productId: prod.id,
        storageKey: `products/${prod.id}/${p.slug}-v1.0.zip`,
        fileName: `${p.slug}-v1.0.zip`,
        mimeType: "application/zip",
        sizeBytes: 85420000, // ~85MB
      },
    });
  }

  // 7. Tutorials with Real, High-Quality Video Guides
  const tutorialDefs = [
    {
      slug: "intro-to-color-grading-in-resolve",
      title: "Intro to Professional Color Grading in DaVinci Resolve",
      description:
        "A comprehensive foundation in DaVinci Resolve: node trees, color management, primary wheels, and building consistent skin tone masks.",
      categorySlug: "color-grading",
      accessType: "FREE" as const,
      contentUrl: "https://www.youtube.com/watch?v=kYvM-Zlh530",
      priceINR: 0,
      priceUSD: 0,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.tutorialColor,
    },
    {
      slug: "speed-ramping-and-optical-flow-mastery",
      title: "Speed Ramping & Optical Flow Mastery",
      description:
        "Master frame blending, optical flow vector tracking, and dynamic speed curves to create smooth-as-butter speed ramps without stutter.",
      categorySlug: "transitions",
      accessType: "PAID" as const,
      contentUrl: "https://www.youtube.com/watch?v=N641g44N7z4",
      priceINR: 299900,
      priceUSD: 3999,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.tutorialSpeed,
    },
    {
      slug: "sound-design-for-motion-graphics",
      title: "Sound Design for Motion Graphics & 3D",
      description:
        "PRO Masterclass: Learn how Hollywood sound designers layer sub-bass hits, micro-whooshes, and texture elements to give motion real weight.",
      categorySlug: "sound-design",
      accessType: "PREMIUM" as const,
      contentUrl: "https://www.youtube.com/watch?v=uoqyG5X_y6A",
      priceINR: 0,
      priceUSD: 0,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.tutorialSound,
    },
    {
      slug: "kinetic-typography-animation-principles",
      title: "Kinetic Typography: Timing, Easing & Hierarchy",
      description:
        "PRO Masterclass: The art and math of animating text. How to control viewer eye-tracking, use easing curves, and design typography that hooks attention.",
      categorySlug: "titles-graphics",
      accessType: "PREMIUM" as const,
      contentUrl: "https://www.youtube.com/watch?v=680X_gK8K0I",
      priceINR: 0,
      priceUSD: 0,
      isPublished: true,
      isFeatured: true,
      thumbnail: IMAGES.tutorialTypography,
    },
    {
      slug: "blender-3d-motion-graphics",
      title: "3D Motion Graphics & Physics Simulation in Blender",
      description:
        "Free masterclass on procedural geometry nodes, rigid body physics, and cinematic lighting setups for 3D motion designers.",
      categorySlug: "plugins",
      accessType: "FREE" as const,
      contentUrl: "https://www.youtube.com/watch?v=nIoXOdoAr-E",
      priceINR: 0,
      priceUSD: 0,
      isPublished: true,
      isFeatured: true,
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    },
    {
      slug: "after-effects-3d-camera-tracking",
      title: "VFX Compositing & 3D Camera Tracking",
      description:
        "PRO Masterclass: Learn exact 3D ground plane extraction, shadow catchers, and seamless visual effects compositing in After Effects.",
      categorySlug: "transitions",
      accessType: "PREMIUM" as const,
      contentUrl: "https://www.youtube.com/watch?v=2eXUfN6oYQo",
      priceINR: 0,
      priceUSD: 0,
      isPublished: true,
      isFeatured: true,
      thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const tutorials: Record<string, any> = {};
  for (const t of tutorialDefs) {
    const { categorySlug, ...data } = t;
    const tut = await prisma.tutorial.create({
      data: {
        ...data,
        categoryId: categories[categorySlug],
      },
    });
    tutorials[t.slug] = tut;
  }

  // 8. Coupons
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  const couponWelcome = await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      startDate: now,
      endDate: nextYear,
      isActive: true,
    },
  });

  const couponPro = await prisma.coupon.create({
    data: {
      code: "PROCREATOR",
      discountType: "PERCENTAGE",
      discountValue: 20,
      startDate: now,
      endDate: nextYear,
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: "SAVE500",
      discountType: "FIXED",
      discountValue: 50000, // ₹500 in paise
      minOrderAmount: 100000,
      startDate: now,
      endDate: nextYear,
      isActive: true,
    },
  });

  // 9. Create Admin User
  const adminEmail = "admin@motionfly.dev";
  const adminPasswordHash = await argon2.hash("Admin@12345", { type: argon2.argon2id });
  const adminUser = await prisma.user.create({
    data: {
      name: "MotionFly Admin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      country: "IN",
      emailVerified: now,
      preference: { create: { theme: "SYSTEM" } },
    },
  });

  // 10. Create The Single Comprehensive Demo Customer with EVERYTHING Populated
  const demoEmail = "demo@motionfly.dev";
  const demoPasswordHash = await argon2.hash("Demo@12345", { type: argon2.argon2id });
  const demoUser = await prisma.user.create({
    data: {
      name: "Jordan Casey",
      email: demoEmail,
      passwordHash: demoPasswordHash,
      role: "CUSTOMER",
      country: "IN",
      loyaltyPoints: 350,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      emailVerified: now,
      preference: { create: { theme: "SYSTEM" } },
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  // 11. Populate Cart Items for Demo User
  const userCart = await prisma.cart.findUnique({ where: { userId: demoUser.id } });
  if (userCart) {
    await prisma.cartItem.create({
      data: {
        cartId: userCart.id,
        type: "PRODUCT",
        productId: products["whoosh-and-impact-sfx-library"].id,
        quantity: 1,
      },
    });
  }

  // 12. Populate Wishlist Items for Demo User
  const userWishlist = await prisma.wishlist.findUnique({ where: { userId: demoUser.id } });
  if (userWishlist) {
    await prisma.wishlistItem.create({
      data: {
        wishlistId: userWishlist.id,
        productId: products["vintage-16mm-film-grain-overlays"].id,
      },
    });
    await prisma.wishlistItem.create({
      data: {
        wishlistId: userWishlist.id,
        productId: products["dynamic-text-animator-plugin"].id,
      },
    });
  }

  // 13. Populate Likes & Reviews from Demo User
  for (const slug of ["glitch-transitions-pack", "cinematic-teal-orange-luts", "cyberpunk-hud-ui-elements"]) {
    const prod = products[slug];
    await prisma.productLike.create({
      data: {
        userId: demoUser.id,
        productId: prod.id,
      },
    });
  }

  await prisma.review.create({
    data: {
      userId: demoUser.id,
      productId: products["glitch-transitions-pack"].id,
      rating: 5,
      content: "These transitions saved my commercial deadline! Drag-and-drop ready and render lightning fast.",
    },
  });

  await prisma.review.create({
    data: {
      userId: demoUser.id,
      productId: products["cinematic-teal-orange-luts"].id,
      rating: 5,
      content: "Incredible film emulation. The skin tones stay natural even with heavy color saturation.",
    },
  });

  // 14. Demo User's Active PRO Subscription
  // Setting period end to 8 DAYS FROM NOW so the 10-day expiring soon banner and badge immediately trigger!
  const subStart = new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000); // 22 days ago
  const subEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);   // Exactly 8 days remaining (<= 10 days!)

  const subscription = await prisma.subscription.create({
    data: {
      userId: demoUser.id,
      planId: yearlyPlan.id,
      provider: "RAZORPAY",
      status: "ACTIVE",
      currency: "INR",
      startDate: subStart,
      currentPeriodStart: subStart,
      currentPeriodEnd: subEnd,
      cancelAtPeriodEnd: false,
      providerSubscriptionId: "sub_demo_yearly_live01",
    },
  });

  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      provider: "RAZORPAY",
      providerPaymentId: "pay_sub_rp_demo_7781",
      amount: yearlyPlan.priceINR,
      currency: "INR",
      status: "SUCCESS",
      periodStart: subStart,
      periodEnd: subEnd,
    },
  });

  // 15. Real Orders, Invoices, Payments, and Downloads for Demo User

  // Order #1: Subscription Purchase
  const orderSub = await prisma.order.create({
    data: {
      orderNumber: "260901-000001",
      userId: demoUser.id,
      billingName: "Jordan Casey",
      billingInfo: {
        address: "42 Creative Hub, Bandra West",
        city: "Mumbai",
        country: "IN",
        postalCode: "400050",
      },
      subtotal: yearlyPlan.priceINR,
      discount: 0,
      total: yearlyPlan.priceINR,
      currency: "INR",
      status: "PAID",
      paymentStatus: "SUCCESS",
      paymentMethod: "RAZORPAY",
      createdAt: subStart,
      items: {
        create: [
          {
            planId: yearlyPlan.id,
            itemTitle: `MotionFly PRO — ${yearlyPlan.name}`,
            price: yearlyPlan.priceINR,
            currency: "INR",
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: orderSub.id,
      provider: "RAZORPAY",
      providerPaymentId: "pay_rp_sub_init_7781",
      providerOrderId: "order_rp_sub_init_7781",
      amount: yearlyPlan.priceINR,
      currency: "INR",
      status: "SUCCESS",
      createdAt: subStart,
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-000001",
      orderId: orderSub.id,
      userId: demoUser.id,
      billingName: "Jordan Casey",
      billingEmail: demoEmail,
      billingInfo: {
        address: "42 Creative Hub, Bandra West",
        city: "Mumbai",
        country: "IN",
        postalCode: "400050",
      },
      subtotal: yearlyPlan.priceINR,
      discount: 0,
      tax: 0,
      total: yearlyPlan.priceINR,
      currency: "INR",
      paymentMethod: "RAZORPAY",
      issuedAt: subStart,
    },
  });

  // Order #2: Product Purchase (Glitch Transitions + Cyberpunk HUD)
  const prod1 = products["glitch-transitions-pack"];
  const prod2 = products["cyberpunk-hud-ui-elements"];
  const order2Total = prod1.priceINR + prod2.priceINR;
  const order2Date = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const orderProducts = await prisma.order.create({
    data: {
      orderNumber: "260908-000002",
      userId: demoUser.id,
      billingName: "Jordan Casey",
      billingInfo: {
        address: "42 Creative Hub, Bandra West",
        city: "Mumbai",
        country: "IN",
        postalCode: "400050",
      },
      subtotal: order2Total,
      discount: 0,
      total: order2Total,
      currency: "INR",
      status: "PAID",
      paymentStatus: "SUCCESS",
      paymentMethod: "RAZORPAY",
      createdAt: order2Date,
      items: {
        create: [
          {
            productId: prod1.id,
            itemTitle: prod1.title,
            price: prod1.priceINR,
            currency: "INR",
            quantity: 1,
          },
          {
            productId: prod2.id,
            itemTitle: prod2.title,
            price: prod2.priceINR,
            currency: "INR",
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: orderProducts.id,
      provider: "RAZORPAY",
      providerPaymentId: "pay_rp_demo_prod_9921",
      providerOrderId: "order_rp_demo_prod_9921",
      amount: order2Total,
      currency: "INR",
      status: "SUCCESS",
      createdAt: order2Date,
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-000002",
      orderId: orderProducts.id,
      userId: demoUser.id,
      billingName: "Jordan Casey",
      billingEmail: demoEmail,
      billingInfo: {
        address: "42 Creative Hub, Bandra West",
        city: "Mumbai",
        country: "IN",
        postalCode: "400050",
      },
      subtotal: order2Total,
      discount: 0,
      tax: 0,
      total: order2Total,
      currency: "INR",
      paymentMethod: "RAZORPAY",
      issuedAt: order2Date,
    },
  });

  // Downloads for purchased products
  await prisma.download.create({
    data: {
      orderId: orderProducts.id,
      productId: prod1.id,
      userId: demoUser.id,
      token: "demo_token_glitch_transitions_pack",
      status: "SUCCESS",
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days
      maxDownloads: 10,
      downloadCount: 2,
    },
  });

  await prisma.download.create({
    data: {
      orderId: orderProducts.id,
      productId: prod2.id,
      userId: demoUser.id,
      token: "demo_token_cyberpunk_hud_ui",
      status: "SUCCESS",
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      maxDownloads: 10,
      downloadCount: 1,
    },
  });

  // Order #3: Paid Tutorial Purchase (Speed Ramping Masterclass)
  const tut1 = tutorials["speed-ramping-and-optical-flow-mastery"];
  const order3Date = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const orderTut = await prisma.order.create({
    data: {
      orderNumber: "260917-000003",
      userId: demoUser.id,
      billingName: "Jordan Casey",
      billingInfo: {
        address: "42 Creative Hub, Bandra West",
        city: "Mumbai",
        country: "IN",
        postalCode: "400050",
      },
      subtotal: tut1.priceINR,
      discount: 0,
      total: tut1.priceINR,
      currency: "INR",
      status: "PAID",
      paymentStatus: "SUCCESS",
      paymentMethod: "PAYPAL",
      createdAt: order3Date,
      items: {
        create: [
          {
            tutorialId: tut1.id,
            itemTitle: tut1.title,
            price: tut1.priceINR,
            currency: "INR",
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: orderTut.id,
      provider: "PAYPAL",
      providerPaymentId: "pp_capture_tut_9918",
      providerOrderId: "pp_order_tut_9918",
      amount: tut1.priceINR,
      currency: "INR",
      status: "SUCCESS",
      createdAt: order3Date,
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-000003",
      orderId: orderTut.id,
      userId: demoUser.id,
      billingName: "Jordan Casey",
      billingEmail: demoEmail,
      billingInfo: {
        address: "42 Creative Hub, Bandra West",
        city: "Mumbai",
        country: "IN",
        postalCode: "400050",
      },
      subtotal: tut1.priceINR,
      discount: 0,
      tax: 0,
      total: tut1.priceINR,
      currency: "INR",
      paymentMethod: "PAYPAL",
      issuedAt: order3Date,
    },
  });

  // Order #4: A Pending Order (for demonstration of order filters: All / Pending / Paid)
  const prodVintage = products["vintage-16mm-film-grain-overlays"];
  await prisma.order.create({
    data: {
      orderNumber: "260922-000004",
      userId: demoUser.id,
      billingName: "Jordan Casey",
      billingInfo: {
        address: "42 Creative Hub, Bandra West",
        city: "Mumbai",
        country: "IN",
        postalCode: "400050",
      },
      subtotal: prodVintage.priceINR,
      discount: 0,
      total: prodVintage.priceINR,
      currency: "INR",
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "STRIPE",
      createdAt: now,
      items: {
        create: [
          {
            productId: prodVintage.id,
            itemTitle: prodVintage.title,
            price: prodVintage.priceINR,
            currency: "INR",
            quantity: 1,
          },
        ],
      },
    },
  });

  // 12. Seed High-Impact Hero Slides for the Promotional Slider
  await prisma.heroSlide.deleteMany();
  await prisma.heroSlide.createMany({
    data: [
      {
        title: "Creator All-Access Pass: Supercharge Your Edits",
        subtitle: JSON.stringify({
          htmlDescription: "Instant access to every DaVinci plugin, Premiere preset, and 4K film asset with weekly drops.",
          badgeText: "LIMITED TIME VIP PASS",
          bgPreset: "gradient-indigo",
          horizontalAlign: "left",
          verticalAlign: "center",
          btnVariant: "primary",
          overlayOpacity: 60,
          secondaryCtaLabel: "View Catalog",
          secondaryCtaHref: "/products",
        }),
        imageUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1600&q=80",
        ctaLabel: "Get All-Access",
        ctaHref: "/subscriptions",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Hollywood Color Grading: 35mm Analog Warmth",
        subtitle: JSON.stringify({
          htmlDescription: "Engineered from genuine 16mm and 35mm Kodak 500T scans with film halation and grain textures.",
          badgeText: "FLAGSHIP COLOR SUITE",
          bgPreset: "gradient-amber",
          horizontalAlign: "left",
          verticalAlign: "center",
          btnVariant: "gradient",
          overlayOpacity: 55,
          secondaryCtaLabel: "Free Starter Pack",
          secondaryCtaHref: "/products?free=true",
        }),
        imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80",
        ctaLabel: "Explore LUTs",
        ctaHref: "/products?q=LUT",
        sortOrder: 2,
        isActive: true,
      },
    ],
  });

  console.log("✔ Complete demo data seeded successfully!");
  return {
    success: true,
    userEmail: demoEmail,
    userPassword: "Demo@12345",
    adminEmail,
    adminPassword: "Admin@12345",
  };
}
