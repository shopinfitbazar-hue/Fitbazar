import { Image } from "expo-image";
import { API_BASE_URL } from "@/api/client";

export const IMAGE_PLACEHOLDER = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export function optimizedImageUrl(value: string | null | undefined, width = 480, quality = 72) {
  if (!value) return null;
  const source = value.startsWith("/") ? `${API_BASE_URL}${value}` : value;

  try {
    const url = new URL(source);
    if (url.hostname === "res.cloudinary.com" && url.pathname.includes("/upload/")) {
      return source.replace("/upload/", `/upload/f_auto,q_${quality},c_limit,w_${width}/`);
    }
    if (url.hostname.endsWith("unsplash.com")) {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", String(quality));
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      return url.toString();
    }
  } catch {
    return source;
  }

  return source;
}

export function prefetchImages(values: Array<string | null | undefined>, width = 480) {
  const urls = values.map((value) => optimizedImageUrl(value, width)).filter((value): value is string => Boolean(value));
  if (!urls.length) return Promise.resolve(false);
  return Image.prefetch(urls, "memory-disk").catch(() => false);
}
