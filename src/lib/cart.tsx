"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { CartItem, GUEST_CART_STORAGE_KEY, mergeCartCollections } from "@/lib/cart-state";
import { requestJson } from "@/lib/api-client";
import { logger } from "@/lib/logger";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  total: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const mergedGuestRef = useRef<string | null>(null);
  const userRole = session?.user?.role;

  useEffect(() => {
    if (status === "loading") return;

    async function loadCart() {
      if (session?.user?.id) {
        if (userRole !== "CUSTOMER") {
          setItems([]);
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          return;
        }

        const guestItems = readGuestCart();
        const mergeKey = `${session.user.id}:${guestItems.length}`;

        if (guestItems.length && mergedGuestRef.current !== mergeKey) {
          mergedGuestRef.current = mergeKey;

          for (const item of guestItems) {
            await requestJson("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
              }),
              fallbackMessage: "Failed to merge guest cart",
            }).catch(() => undefined);
          }

          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
        }

        const data = await requestJson<{ items?: CartItem[] }>("/api/cart", {
          cache: "no-store",
          fallbackMessage: "Failed to load cart",
        }).catch(() => null);

        if (!data) {
          setItems([]);
          return;
        }

        setItems(data.items || []);
        return;
      }

      setItems(readGuestCart());
    }

    void loadCart();
  }, [session?.user?.id, status, userRole]);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, status]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    if (session?.user?.id) {
      if (userRole !== "CUSTOMER") {
        setItems([]);
        return;
      }

      const previous = items;

      setItems((prev) =>
        mergeCartCollections(prev, [
          {
            ...item,
            id: `cart_${item.productId}_${item.size || "default"}_${item.color || "default"}`,
          },
        ]),
      );

      void requestJson("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        }),
        fallbackMessage: "Failed to add cart item",
      })
        .then(async () => {
          const data = await requestJson<{ items?: CartItem[] }>("/api/cart", {
            cache: "no-store",
            fallbackMessage: "Failed to refresh cart",
          });
          setItems(data.items || []);
        })
        .catch((error) => {
          logger.warn("Rolling back optimistic cart add", { error: error instanceof Error ? error.message : String(error) });
          setItems(previous);
        });

      return;
    }

    setItems((prev) =>
      mergeCartCollections(prev, [
        {
          ...item,
          id: `cart_${Date.now()}`,
        },
      ]),
    );
  }, [items, session?.user?.id, userRole]);

  const removeItem = useCallback((itemId: string) => {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    if (!session?.user?.id) return;

    void requestJson(`/api/cart/${itemId}`, {
      method: "DELETE",
      fallbackMessage: "Failed to remove cart item",
    }).catch(() => {
      setItems(previous);
    });
  }, [items, session?.user?.id]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    const previous = items;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));

    if (!session?.user?.id) return;

    void requestJson(`/api/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
      fallbackMessage: "Failed to update cart quantity",
    }).catch(() => {
      setItems(previous);
    });
  }, [items, removeItem, session?.user?.id]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (!session?.user?.id) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      return;
    }

    void requestJson("/api/cart", {
      method: "DELETE",
      fallbackMessage: "Failed to clear cart",
    }).catch(() => undefined);
  }, [session?.user?.id]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

function readGuestCart(): CartItem[] {
  const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as CartItem[];
  } catch (error) {
    logger.error("Failed to parse guest cart", error);
    return [];
  }
}
