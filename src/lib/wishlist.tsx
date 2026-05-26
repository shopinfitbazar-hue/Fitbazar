"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  GUEST_WISHLIST_STORAGE_KEY,
  WishlistItem,
  mergeWishlistCollections,
} from "@/lib/cart-state";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/media";

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, "id">) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  isInWishlist: () => false,
  clearWishlist: () => {},
  itemCount: 0,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const mergedGuestRef = useRef<string | null>(null);
  const userRole = session?.user?.role;

  useEffect(() => {
    if (status === "loading") return;

    async function loadWishlist() {
      if (session?.user?.id) {
        if (userRole !== "CUSTOMER") {
          setItems([]);
          localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
          return;
        }

        const guestItems = readGuestWishlist();
        const mergeKey = `${session.user.id}:${guestItems.length}`;

        if (guestItems.length && mergedGuestRef.current !== mergeKey) {
          mergedGuestRef.current = mergeKey;
          await Promise.all(
            guestItems.map((item) =>
              fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: item.productId }),
              }).catch(() => undefined),
            ),
          );
          localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
        }

        const response = await fetch("/api/wishlist", { cache: "no-store" }).catch(() => null);
        if (!response?.ok) {
          setItems([]);
          return;
        }

        const data = (await response.json()) as {
          wishlist?: Array<{
            id: string;
            productId: string;
            product: {
              id: string;
              slug: string;
              name: string;
              price: number;
              compareAtPrice: number | null;
              images: string[];
              vendor: { shopName: string; slug: string };
            };
          }>;
        };

        setItems(
          (data.wishlist || []).map((item) => ({
            id: item.id,
            productId: item.productId,
            slug: item.product.slug,
            name: item.product.name,
            price: item.product.price,
            originalPrice: item.product.compareAtPrice ?? undefined,
            image: item.product.images[0] || FALLBACK_PRODUCT_IMAGE,
            vendorName: item.product.vendor.shopName,
            vendorSlug: item.product.vendor.slug,
          })),
        );
        return;
      }

      setItems(readGuestWishlist());
    }

    void loadWishlist();
  }, [session?.user?.id, status, userRole]);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items, status]);

  const addItem = useCallback((item: Omit<WishlistItem, "id">) => {
    if (session?.user?.id && userRole !== "CUSTOMER") {
      setItems([]);
      return;
    }

    const optimisticId = `wishlist_${item.productId}`;

    setItems((prev) =>
      mergeWishlistCollections(prev, [
        {
          ...item,
          id: optimisticId,
        },
      ]),
    );

    if (!session?.user?.id) return;

    void fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.productId }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to add wishlist item");

        const refreshResponse = await fetch("/api/wishlist", { cache: "no-store" });
        if (!refreshResponse.ok) return;
        const data = (await refreshResponse.json()) as {
          wishlist?: Array<{
            id: string;
            productId: string;
            product: {
              slug: string;
              name: string;
              price: number;
              compareAtPrice: number | null;
              images: string[];
              vendor: { shopName: string; slug: string };
            };
          }>;
        };

        setItems(
          (data.wishlist || []).map((entry) => ({
            id: entry.id,
            productId: entry.productId,
            slug: entry.product.slug,
            name: entry.product.name,
            price: entry.product.price,
            originalPrice: entry.product.compareAtPrice ?? undefined,
            image: entry.product.images[0] || FALLBACK_PRODUCT_IMAGE,
            vendorName: entry.product.vendor.shopName,
            vendorSlug: entry.product.vendor.slug,
          })),
        );
      })
      .catch(() => {
        setItems((prev) => prev.filter((entry) => entry.id !== optimisticId));
      });
  }, [session?.user?.id, userRole]);

  const removeItem = useCallback((productId: string) => {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.productId !== productId));

    if (!session?.user?.id) return;

    void fetch(`/api/wishlist/${productId}`, { method: "DELETE" }).catch(() => {
      setItems(previous);
    });
  }, [items, session?.user?.id]);

  const isInWishlist = useCallback((productId: string) => {
    return items.some((i) => i.productId === productId);
  }, [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
    if (!session?.user?.id) {
      localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
      return;
    }

    void Promise.all(items.map((item) => fetch(`/api/wishlist/${item.productId}`, { method: "DELETE" }).catch(() => undefined)));
  }, [items, session?.user?.id]);

  const itemCount = items.length;

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist, clearWishlist, itemCount }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}

function readGuestWishlist(): WishlistItem[] {
  const stored = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as WishlistItem[];
  } catch (error) {
    console.error("Failed to parse guest wishlist", error);
    return [];
  }
}
