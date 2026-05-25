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
  heroEyebrow: "Nepal's premium fashion marketplace",
  heroTitle: "Discover sharper style, faster shopping, and curated Nepal-first fashion.",
  heroSubtitle: "Mobile-first discovery, partner-led fashion drops, and cleaner product storytelling built for modern shoppers.",
  heroPrimaryLabel: "Shop New Arrivals",
  heroPrimaryHref: "/products",
  heroSecondaryLabel: "Explore Collections",
  heroSecondaryHref: "/discover",
};

export function cleanInternalHref(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  return fallback;
}
