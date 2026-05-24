import { getSafeHref } from "@/lib/media";

const AUTH_BLOCKED_PREFIXES = ["/login", "/signup", "/logout", "/api/auth"];

export function normalizeAuthCallbackPath(value: string | null | undefined, fallback = "/") {
  const safeHref = getSafeHref(value ?? null, fallback);
  let path = fallback;

  if (safeHref.startsWith("/")) {
    path = safeHref;
  } else {
    try {
      const parsed = new URL(safeHref);
      path = `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
    } catch {
      path = fallback;
    }
  }

  if (AUTH_BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}?`) || path.startsWith(`${prefix}#`))) {
    return fallback;
  }

  return path || fallback;
}

export function getDefaultPostLoginPath(role?: string | null) {
  if (role === "ADMIN") return "/admin";
  if (role === "VENDOR") return "/vendor/dashboard";
  return "/account/dashboard";
}

export function resolvePostLoginPath(callbackUrl: string | null | undefined, role?: string | null) {
  const normalized = normalizeAuthCallbackPath(callbackUrl, "/");
  if (normalized !== "/") {
    return normalized;
  }

  return getDefaultPostLoginPath(role);
}
