function normalizeBaseUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) {
    return normalized.replace(/\/$/, "");
  }

  return `https://${normalized.replace(/\/$/, "")}`;
}

export function getAppBaseUrl() {
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : null;

  return (
    normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_VERCEL_URL) ||
    vercelUrl ||
    normalizeBaseUrl(process.env.NEXTAUTH_URL) ||
    "http://localhost:3000"
  );
}

export function buildAbsoluteAppUrl(path: string) {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
