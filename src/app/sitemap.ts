import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { logger } from "@/lib/logger";
import { publicProductVisibilityFilter, publicVendorVisibilityFilter } from "@/lib/public-storefront";
import { collectionDefinitions } from "@/lib/seo";
import { categorySlug } from "@/lib/categories";
import { getAllBlogPosts, getBlogCategories } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: Array<{ slug: string; updatedAt: Date }> = [];
  let vendors: Array<{ slug: string; createdAt: Date }> = [];
  let categories: Array<{ name: string; slug: string; createdAt: Date }> = [];

  try {
    [products, vendors, categories] = await Promise.all([
      prisma.product.findMany({
        where: publicProductVisibilityFilter,
        select: { slug: true, updatedAt: true },
        take: 5000,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.vendor.findMany({
        where: publicVendorVisibilityFilter,
        select: { slug: true, createdAt: true },
        take: 500,
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        select: { name: true, slug: true, createdAt: true },
        take: 500,
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (error) {
    logger.warn("Sitemap database fetch failed; falling back to static routes only", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const knownCollectionSlugs = new Set([
    ...Object.values(collectionDefinitions).map((collection) => collection.slug),
    "ethnic-wear",
    "sports",
  ]);
  const dynamicCategoryRoutes = categories
    .map((category) => ({
      slug: category.slug || categorySlug(category.name),
      lastModified: category.createdAt,
    }))
    .filter((category) => category.slug && !knownCollectionSlugs.has(category.slug));
  const blogPosts = getAllBlogPosts();
  const blogCategories = getBlogCategories();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    ...Object.values(collectionDefinitions).map((collection) => `/collections/${collection.slug}`),
    ...dynamicCategoryRoutes.map((category) => `/collections/${category.slug}`),
    "/discover",
    "/ai-try-on",
    "/about-us",
    "/contact-us",
    "/help",
    "/return-refund-policy",
    "/privacy-policy",
    "/terms-conditions",
    "/careers",
    "/press",
    "/vendor/register",
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path.startsWith("/collections") || path === "/products" ? "daily" : "weekly",
    priority: path === "" ? 1 : path.startsWith("/collections") ? 0.85 : path === "/products" ? 0.9 : 0.65,
  }));

  return [
    ...staticRoutes,
    {
      url: `${siteConfig.url}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...blogCategories.map((category) => ({
      url: `${siteConfig.url}/blog/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...blogPosts.map((post) => ({
      url: `${siteConfig.url}${post.path}`,
      lastModified: new Date(post.updatedAt || post.date),
      changeFrequency: "monthly" as const,
      priority: 0.74,
    })),
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
