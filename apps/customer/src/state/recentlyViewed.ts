import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import type { PublicProductSummary } from "@fitbazar/shared-types";

const STORAGE_KEY = "fitbazar.customer.recentlyViewed";

type RecentState = {
  products: PublicProductSummary[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (product: PublicProductSummary) => Promise<void>;
  clear: () => Promise<void>;
};

export const useRecentlyViewed = create<RecentState>((set, get) => ({
  products: [],
  hydrated: false,
  async hydrate() {
    if (get().hydrated) return;
    const raw = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
    try {
      const products = raw ? (JSON.parse(raw) as PublicProductSummary[]) : [];
      set({ products: Array.isArray(products) ? products.slice(0, 20) : [], hydrated: true });
    } catch {
      set({ products: [], hydrated: true });
    }
  },
  async add(product) {
    const products = [product, ...get().products.filter((item) => item.id !== product.id)].slice(0, 20);
    set({ products });
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(products)).catch(() => undefined);
  },
  async clear() {
    set({ products: [] });
    await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => undefined);
  },
}));
