function normalizeBaseUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) {
    return normalized.replace(/\/$/, "");
  }

  return `https://${normalized.replace(/\/$/, "")}`;
}

function isLocalUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
  } catch {
    return false;
  }
}

function normalizeProductionUrl(value?: string | null) {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return null;

  if (process.env.NODE_ENV === "production" && isLocalUrl(normalized)) {
    return null;
  }

  return normalized;
}

export function getAppBaseUrl() {
  return (
    normalizeProductionUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeProductionUrl(process.env.SITE_URL) ||
    normalizeProductionUrl(process.env.APP_URL) ||
    normalizeProductionUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeProductionUrl(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeProductionUrl(process.env.VERCEL_URL) ||
    normalizeProductionUrl(process.env.NEXT_PUBLIC_VERCEL_URL) ||
    normalizeProductionUrl(process.env.NEXTAUTH_URL) ||
    "http://localhost:3000"
  );
}

export function buildAbsoluteAppUrl(path: string) {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
