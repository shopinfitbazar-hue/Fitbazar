import { collectionHrefForCategory } from "./categories";

export type SearchSuggestion =
  | { type: "category"; name: string; slug: string }
  | { type: "brand"; name: string }
  | { type: "product"; name: string; slug?: never };

export const searchSuggestions = [
  { type: "category", name: "Men's Fashion", slug: "mens-fashion-nepal" },
  { type: "category", name: "Women's Fashion", slug: "womens-fashion-nepal" },
  { type: "category", name: "Ethnic Wear", slug: "ethnic" },
  { type: "category", name: "Footwear", slug: "footwear" },
  { type: "category", name: "Accessories", slug: "accessories" },
  { type: "brand", name: "Himalayan Loom" },
  { type: "brand", name: "Kathmandu Threads" },
  { type: "product", name: "Silk Embroidered Kurta" },
  { type: "product", name: "Wool Sweater" },
] satisfies SearchSuggestion[];

export const trendingSearches = [
  "Silk Kurta",
  "Sneakers",
  "Hoodies",
  "Kurta set",
  "Watches",
];

export function suggestionHref(item: SearchSuggestion) {
  if (item.type === "product") return `/products?q=${encodeURIComponent(item.name)}`;
  if (item.type === "category") return collectionHrefForCategory(item.name);
  return `/search?q=${encodeURIComponent(item.name)}`;
}
