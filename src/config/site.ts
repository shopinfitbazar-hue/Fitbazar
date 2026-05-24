import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/app-url";

const baseUrl = getAppBaseUrl();

export const siteConfig = {
  name: "Fit Bazzar",
  shortName: "Fit Bazzar",
  title: "Fit Bazzar | Premium Fashion Marketplace in Nepal",
  description:
    "Fit Bazzar is a premium Nepal-first fashion marketplace with fast discovery, elegant storefronts, and modern commerce built for mobile shoppers.",
  url: baseUrl,
  ogImage: "/opengraph-image.png",
  locale: "en_NP",
  keywords: [
    "Fit Bazzar",
    "Nepal fashion marketplace",
    "online shopping Nepal",
    "fashion ecommerce Nepal",
    "premium clothing Nepal",
  ],
  social: {
    instagram: "https://instagram.com/fitbazzar",
    facebook: "https://facebook.com/fitbazzar",
  },
} as const;

export function buildMetadata(overrides?: Metadata): Metadata {
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteConfig.title,
      template: "%s | Fit Bazzar",
    },
    description: siteConfig.description,
    applicationName: siteConfig.shortName,
    keywords: [...siteConfig.keywords],
    category: "fashion",
    creator: siteConfig.name,
    publisher: siteConfig.name,
    authors: [{ name: siteConfig.name }],
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
    ...overrides,
  };
}
