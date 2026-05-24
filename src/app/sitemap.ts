import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { logger } from "@/lib/logger";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: Array<{ slug: string; updatedAt: Date }> = [];
  let vendors: Array<{ slug: string; createdAt: Date }> = [];

  try {
    [products, vendors] = await Promise.all([
      prisma.product.findMany({
        select: { slug: true, updatedAt: true },
        take: 1000,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.vendor.findMany({
        select: { slug: true, createdAt: true },
        take: 500,
        orderBy: { createdAt: "desc" },
      }),
    ]);
  } catch (error) {
    logger.warn("Sitemap database fetch failed; falling back to static routes only", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/discover",
    "/search",
    "/cart",
    "/checkout",
    "/about-us",
    "/contact-us",
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      url: `${siteConfig.url}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...vendors.map((vendor) => ({
      url: `${siteConfig.url}/shop/${vendor.slug}`,
      lastModified: vendor.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
