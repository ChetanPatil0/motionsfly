import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  let products: { slug: string; updatedAt: Date }[] = [];
  let tutorials: { slug: string; updatedAt: Date }[] = [];

  try {
    [products, tutorials] = await Promise.all([
      prisma.product.findMany({ where: { isPublished: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
      prisma.tutorial.findMany({ where: { isPublished: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
    ]);
  } catch {
    // Graceful fallback if database is not available during build
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/tutorials`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/subscriptions`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const tutorialRoutes: MetadataRoute.Sitemap = tutorials.map((t) => ({
    url: `${baseUrl}/tutorials/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...tutorialRoutes];
}
