"use client";

export interface CartItem {
  id: string;
  productId: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  vendorId?: string;
  vendorName?: string;
  vendorSlug?: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  vendorName: string;
  vendorSlug?: string;
}

export const GUEST_CART_STORAGE_KEY = "fitbazar_cart_guest_v2";
export const GUEST_WISHLIST_STORAGE_KEY = "fitbazar_wishlist_guest_v2";

export function mergeCartCollections(current: CartItem[], incoming: CartItem[]): CartItem[] {
  const merged = [...current];

  for (const item of incoming) {
    const existingIndex = merged.findIndex(
      (entry) =>
        entry.productId === item.productId &&
        (entry.size || "") === (item.size || "") &&
        (entry.color || "") === (item.color || ""),
    );

    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: merged[existingIndex].quantity + item.quantity,
      };
      continue;
    }

    merged.push(item);
  }

  return merged;
}

export function mergeWishlistCollections(current: WishlistItem[], incoming: WishlistItem[]): WishlistItem[] {
  const seen = new Set(current.map((item) => item.productId));
  const merged = [...current];

  for (const item of incoming) {
    if (seen.has(item.productId)) continue;
    seen.add(item.productId);
    merged.push(item);
  }

  return merged;
}
