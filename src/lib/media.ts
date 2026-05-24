const KNOWN_BROKEN_IMAGE_PATTERNS = [
  "photo-1583391733958-d25e07fac04f",
];

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
