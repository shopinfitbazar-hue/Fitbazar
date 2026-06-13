import { categorySlug } from "./categories";

export type SearchSuggestion =
  | { type: "category"; name: string; slug: string }
  | { type: "brand"; name: string }
  | { type: "product"; name: string; slug?: never };

export const searchSuggestions = [
  { type: "category", name: "Men", slug: "men" },
  { type: "category", name: "Women", slug: "women" },
  { type: "category", name: "Traditional Wear", slug: "ethnic" },
  { type: "brand", name: "Himalayan Loom" },
  { type: "brand", name: "Kathmandu Threads" },
  { type: "product", name: "Silk Embroidered Kurta" },
  { type: "product", name: "Wool Sweater" },
] satisfies SearchSuggestion[];

export const trendingSearches = [
  "Silk Kurta",
  "Wool Sweater",
  "Pashmina",
  "Daura Suruwal",
  "Dhoti",
];

export function collectionHrefForCategory(name: string) {
  const slug = categorySlug(name);
  if (slug === "men") return "/collections/mens-fashion-nepal";
  if (slug === "women") return "/collections/womens-fashion-nepal";
  if (slug === "ethnic-wear") return "/collections/ethnic";
  if (slug === "sports") return "/collections/streetwear-nepal";
  return `/collections/${slug}`;
}

export function suggestionHref(item: SearchSuggestion) {
  if (item.type === "product") return `/products?q=${encodeURIComponent(item.name)}`;
  if (item.type === "category") return collectionHrefForCategory(item.name);
  return `/search?q=${encodeURIComponent(item.name)}`;
}
