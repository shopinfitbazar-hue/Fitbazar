const KNOWN_BROKEN_IMAGE_PATTERNS = [
  "photo-1583391733958-d25e07fac04f",
];

/* ── Reliable fallback images (Unsplash — whitelisted in next.config.mjs remotePatterns) ── */
export const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=900&auto=format&fit=crop&q=60";
export const FALLBACK_BANNER_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=70";
export const FALLBACK_VENDOR_IMAGE =
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=60";
export const FALLBACK_GALLERY_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=60";
export const FALLBACK_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&auto=format&fit=crop&q=60";


const CLOUDINARY_HOST = "res.cloudinary.com";
const LOCAL_IMAGE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export function getSafeImageUrl(url: string | null | undefined, fallback: string) {
  if (!url) return fallback;

  const normalized = url.trim();
  if (!normalized) return fallback;

  if (normalized.startsWith("/")) {
    return normalized;
  }

  if (KNOWN_BROKEN_IMAGE_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return fallback;
  }

  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol) || LOCAL_IMAGE_HOSTS.has(parsed.hostname)) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return normalized;
}

export function isCloudinaryUrl(url: string) {
  try {
    return new URL(url).hostname === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

export function getOptimizedImageUrl(url: string, options?: { width?: number; quality?: number }) {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const width = options?.width ?? 1200;
  const quality = options?.quality ?? 80;

  return url.replace("/upload/", `/upload/f_auto,q_${quality},c_limit,w_${width}/`);
}

export function getShowcaseImageUrl(
  url: string,
  options?: { width?: number; height?: number; quality?: number; background?: string },
) {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const width = options?.width ?? 900;
  const height = options?.height ?? 1200;
  const quality = options?.quality ?? 82;
  const background = options?.background ?? "f7f1ea";

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_${quality},c_pad,w_${width},h_${height},b_rgb:${background},e_sharpen:45/`,
  );
}

export function buildImageSizes({
  mobile = "50vw",
  tablet = "33vw",
  desktop = "25vw",
}: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
} = {}) {
  return `(max-width: 767px) ${mobile}, (max-width: 1279px) ${tablet}, ${desktop}`;
}

export function getSafeHref(value: string | null | undefined, fallback = "/") {
  if (!value) return fallback;

  const normalized = value.trim();
  if (!normalized) return fallback;

  if (normalized.startsWith("/")) {
    return normalized;
  }

  if (normalized.startsWith("#")) {
    return fallback;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return normalized;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
