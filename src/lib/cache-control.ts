const PUBLIC_STALE_MULTIPLIER = 12;

const PRIVATE_NO_STORE_PREFIXES = [
  "/account",
  "/admin",
  "/cart",
  "/checkout",
  "/order-confirmation",
  "/vendor",
  "/api/account",
  "/api/admin",
  "/api/auth",
  "/api/cart",
  "/api/mobile/v1/auth",
  "/api/mobile/v1/customer",
  "/api/mobile/v1/delivery",
  "/api/mobile/v1/devices",
  "/api/mobile/v1/notifications",
  "/api/mobile/v1/vendor",
  "/api/notifications",
  "/api/orders",
  "/api/payments",
  "/api/support",
  "/api/upload",
  "/api/vendor",
  "/api/wishlist",
];

export function publicCacheHeaders(revalidateSeconds: number) {
  const seconds = Math.max(1, Math.floor(revalidateSeconds || 1));
  const value = `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * PUBLIC_STALE_MULTIPLIER}`;

  return {
    "Cache-Control": value,
    "CDN-Cache-Control": value,
    "Vercel-CDN-Cache-Control": value,
  };
}

export function privateNoStoreHeaders() {
  return {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };
}

export function isPrivateNoStorePath(path: string) {
  return PRIVATE_NO_STORE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function applyHeaders(headers: Headers, values: Record<string, string>) {
  Object.entries(values).forEach(([key, value]) => headers.set(key, value));
}
