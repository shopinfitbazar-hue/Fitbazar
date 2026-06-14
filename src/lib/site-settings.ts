export const SITE_SETTINGS_ID = "site-settings";

export const defaultSiteSettings = {
  commissionPct: 8,
  minFreeDelivery: 2000,
  whatsappNumber: "9779841234567",
  announcementBar: "",
  announcementActive: false,
  supportEmail: "support@fitbazar.com",
  supportPhone: "+977 9800000000",
  supportHours: "Sun-Fri, 10am-6pm",
  heroEyebrow: "New Collection 2026",
  heroTitle: "Discover Style that Defines You",
  heroSubtitle: "Premium quality products for every occasion. Shop the latest trends now.",
  heroPrimaryLabel: "Shop Now",
  heroPrimaryHref: "/products",
  heroSecondaryLabel: "Explore Collection",
  heroSecondaryHref: "/discover",
  seoImage: "/opengraph-image",
};

export function cleanInternalHref(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  return fallback;
}

export function cleanSeoImageUrl(value: string | undefined | null, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}
