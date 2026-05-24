function normalizeBaseUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) {
    return normalized.replace(/\/$/, "");
  }

  return `https://${normalized.replace(/\/$/, "")}`;
}

export function getAppBaseUrl() {
  return (
    normalizeBaseUrl(process.env.NEXTAUTH_URL) ||
    normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL) ||
    "http://localhost:3002"
  );
}

export function buildAbsoluteAppUrl(path: string) {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
