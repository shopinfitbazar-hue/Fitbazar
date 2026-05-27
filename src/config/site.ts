import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/app-url";

const baseUrl = getAppBaseUrl();
const iconVersion = "20260527";

function versionedIcon(path: string) {
  return `${path}?v=${iconVersion}`;
}

export const siteConfig = {
  name: "FitBazar",
  shortName: "FitBazar",
  title: "FitBazar | Online Fashion Shopping in Nepal",
  description:
    "Shop men's, women's, kids', ethnic, sportswear, footwear, and accessories from trusted fashion stores across Nepal on FitBazar.",
  url: baseUrl,
  icon: "/icon.png",
  appleIcon: "/apple-icon.png",
  favicon: "/favicon.ico",
  ogImage: "/opengraph-image",
  locale: "en_NP",
  keywords: [
    "FitBazar",
    "Fit Bazar",
    "Nepal fashion marketplace",
    "online shopping Nepal",
    "fashion ecommerce Nepal",
    "clothing online Nepal",
    "men fashion Nepal",
    "women fashion Nepal",
    "ethnic wear Nepal",
    "Kathmandu fashion store",
  ],
  social: {
    instagram: "https://instagram.com/fitbazzar",
    facebook: "https://facebook.com/fitbazzar",
  },
} as const;

export function buildMetadata(overrides?: Metadata): Metadata {
  const defaults: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteConfig.title,
      template: "%s | FitBazar",
    },
    description: siteConfig.description,
    applicationName: siteConfig.shortName,
    keywords: [...siteConfig.keywords],
    category: "fashion ecommerce",
    creator: siteConfig.name,
    publisher: siteConfig.name,
    authors: [{ name: siteConfig.name }],
    generator: "Next.js",
    icons: {
      icon: [
        { url: versionedIcon(siteConfig.favicon), sizes: "64x64", type: "image/x-icon" },
        { url: versionedIcon(siteConfig.icon), sizes: "512x512", type: "image/png" },
      ],
      shortcut: versionedIcon(siteConfig.favicon),
      apple: [{ url: versionedIcon(siteConfig.appleIcon), sizes: "180x180", type: "image/png" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: baseUrl,
      title: siteConfig.title,
      description: siteConfig.description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    alternates: {
      canonical: baseUrl,
    },
  };

  if (!overrides) return defaults;

  const defaultRobots = defaults.robots && typeof defaults.robots === "object" ? defaults.robots : {};
  const overrideRobots = overrides.robots && typeof overrides.robots === "object" ? overrides.robots : {};
  const defaultGoogleBot = defaultRobots.googleBot && typeof defaultRobots.googleBot === "object" ? defaultRobots.googleBot : {};
  const overrideGoogleBot = overrideRobots.googleBot && typeof overrideRobots.googleBot === "object" ? overrideRobots.googleBot : {};

  return {
    ...defaults,
    ...overrides,
    openGraph: {
      ...(defaults.openGraph && typeof defaults.openGraph === "object" ? defaults.openGraph : {}),
      ...(overrides.openGraph && typeof overrides.openGraph === "object" ? overrides.openGraph : {}),
    },
    twitter: {
      ...(defaults.twitter && typeof defaults.twitter === "object" ? defaults.twitter : {}),
      ...(overrides.twitter && typeof overrides.twitter === "object" ? overrides.twitter : {}),
    },
    robots: {
      ...defaultRobots,
      ...overrideRobots,
      googleBot: {
        ...defaultGoogleBot,
        ...overrideGoogleBot,
      },
    },
    alternates: {
      ...(defaults.alternates && typeof defaults.alternates === "object" ? defaults.alternates : {}),
      ...(overrides.alternates && typeof overrides.alternates === "object" ? overrides.alternates : {}),
    },
  };
}
