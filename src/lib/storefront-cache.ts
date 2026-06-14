import { revalidatePath, revalidateTag } from "next/cache";

const STOREFRONT_CACHE_TAGS = [
  "public-homepage",
  "public-products",
  "public-search",
  "public-vendors",
  "public-vendor-store",
  "public-product-detail",
  "public-collections",
  "public-categories",
  "public-site-settings",
];

const STOREFRONT_CACHE_PATHS: Array<[string, "page" | "layout" | undefined]> = [
  ["/", "page"],
  ["/products", "page"],
  ["/search", "page"],
  ["/sitemap.xml", "page"],
  ["/products/[id]", "page"],
  ["/shop/[vendorSlug]", "page"],
  ["/collections/[slug]", "page"],
];

export function revalidateStorefrontCache() {
  STOREFRONT_CACHE_TAGS.forEach((tag) => revalidateTag(tag));
  STOREFRONT_CACHE_PATHS.forEach(([path, type]) => revalidatePath(path, type));
}
