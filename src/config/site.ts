import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/app-url";

const baseUrl = getAppBaseUrl();
export const siteConfig = {
  name: "FitBazar",
  shortName: "FitBazar",
  title: "FitBazar | Online Fashion Shopping in Nepal",
  description:
    "Shop men's, women's, kids', ethnic, sportswear, footwear, and accessories from trusted fashion stores across Nepal on FitBazar.",
  url: baseUrl,
  icon: "/fitbazar-icon-20260527.png",
  appleIcon: "/apple-touch-icon.png",
  favicon: "/fitbazar-favicon-20260527.ico",
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
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: siteConfig.favicon, sizes: "64x64", type: "image/x-icon" },
        { url: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: siteConfig.icon, sizes: "512x512", type: "image/png" },
      ],
      shortcut: siteConfig.favicon,
      apple: [{ url: siteConfig.appleIcon, sizes: "180x180", type: "image/png" }],
    },
    other: {
      "msapplication-TileColor": "#111827",
      "msapplication-TileImage": "/mstile-150x150.png",
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
