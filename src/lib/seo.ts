import type { Metadata } from "next";
import type { Review } from "@prisma/client";
import { siteConfig } from "@/config/site";
import { categorySlug, normalizeCategory } from "@/lib/categories";

export type BreadcrumbItem = {
  name: string;
  path?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

type ProductSchemaInput = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  images: string[];
  price: number;
  compareAtPrice?: number | null;
  discountPct?: number | null;
  category: string;
  stock: number;
  updatedAt?: Date | string;
  vendor?: {
    shopName: string;
    slug: string;
  } | null;
  reviews?: Array<Pick<Review, "rating" | "comment" | "createdAt"> & {
    user?: {
      name?: string | null;
    } | null;
  }>;
  reviewCount?: number;
};

export const collectionDefinitions = {
  men: {
    slug: "men",
    category: "Men",
    title: "Men's Fashion in Nepal",
    description:
      "Shop men's clothing, everyday wear, sportswear, footwear, and accessories from trusted fashion stores in Nepal.",
    keywords: ["men fashion Nepal", "men clothing Nepal", "online menswear Nepal"],
    faq: [
      {
        question: "Where can I buy men's fashion online in Nepal?",
        answer: "You can shop men's clothing, shoes, accessories, and everyday fashion from trusted Nepal stores on FitBazar.",
      },
      {
        question: "Does FitBazar list men's fashion from local sellers?",
        answer: "Yes. FitBazar focuses on Nepal-first fashion discovery with approved sellers and mobile-friendly product pages.",
      },
    ],
  },
  mensFashionNepal: {
    slug: "mens-fashion-nepal",
    category: "Men",
    title: "Men's Fashion Nepal",
    description:
      "Shop men's fashion in Nepal including t-shirts, shirts, hoodies, streetwear, trousers, shoes, and accessories from trusted FitBazar stores.",
    keywords: ["mens fashion Nepal", "men's fashion Nepal", "men clothing online Nepal", "buy menswear Nepal"],
    relatedCollections: ["hoodies-nepal", "streetwear-nepal", "oversized-tshirts-nepal", "footwear"],
    faq: [
      {
        question: "What men's fashion products are available on FitBazar?",
        answer: "FitBazar lists men's t-shirts, hoodies, shirts, trousers, footwear, accessories, streetwear, and seasonal fashion from Nepal-based sellers.",
      },
      {
        question: "Can I find men's streetwear and casual clothing in Nepal?",
        answer: "Yes. The men's fashion collection links to streetwear, hoodies, oversized t-shirts, footwear, and other casual styles for Nepal shoppers.",
      },
      {
        question: "Are FitBazar men's fashion pages mobile-friendly?",
        answer: "Yes. Product cards, filters, images, prices, and checkout flows are designed for mobile-first browsing in Nepal.",
      },
    ],
  },
  women: {
    slug: "women",
    category: "Women",
    title: "Women's Fashion in Nepal",
    description:
      "Discover women's clothing, ethnic wear, footwear, accessories, and curated everyday outfits from Nepal fashion stores.",
    keywords: ["women fashion Nepal", "women clothing Nepal", "online womenswear Nepal"],
    faq: [
      {
        question: "Where can I shop women's fashion online in Nepal?",
        answer: "FitBazar helps you discover women's clothing, ethnic wear, shoes, and accessories from trusted fashion sellers in Nepal.",
      },
      {
        question: "Does FitBazar have women's ethnic and everyday fashion?",
        answer: "Yes. You can browse both everyday outfits and ethnic wear collections with clear product information and seller links.",
      },
    ],
  },
  womensFashionNepal: {
    slug: "womens-fashion-nepal",
    category: "Women",
    title: "Women's Fashion Nepal",
    description:
      "Shop women's fashion in Nepal including everyday clothing, ethnic wear, festive outfits, footwear, and accessories from trusted FitBazar sellers.",
    keywords: ["womens fashion Nepal", "women's fashion Nepal", "women clothing online Nepal", "ladies fashion Nepal"],
    relatedCollections: ["ethnic", "accessories", "footwear", "sale"],
    faq: [
      {
        question: "What women's fashion categories can I shop on FitBazar?",
        answer: "You can shop women's everyday clothing, ethnic wear, footwear, accessories, festive outfits, and sale picks from Nepal fashion stores.",
      },
      {
        question: "Can I find festive women's outfits in Nepal on FitBazar?",
        answer: "Yes. The women's fashion collection links into ethnic wear, accessories, footwear, and sale collections for festive and everyday styling.",
      },
      {
        question: "Are women's fashion products listed with seller details?",
        answer: "Yes. Product pages include store links, pricing, images, available sizes or colors, and related products where available.",
      },
    ],
  },
  kids: {
    slug: "kids",
    category: "Kids",
    title: "Kids' Fashion in Nepal",
    description:
      "Shop kids' clothing, party wear, shoes, and comfortable everyday outfits from trusted sellers across Nepal.",
    keywords: ["kids fashion Nepal", "kids clothing Nepal", "children wear Nepal"],
  },
  ethnic: {
    slug: "ethnic",
    category: "Ethnic Wear",
    title: "Ethnic Wear in Nepal",
    description:
      "Shop kurta sets, festive outfits, traditional clothing, shawls, and Nepali-inspired ethnic fashion online.",
    keywords: ["ethnic wear Nepal", "kurta set Nepal", "traditional clothing Nepal"],
  },
  sportswear: {
    slug: "sportswear",
    category: "Sportswear",
    title: "Sportswear in Nepal",
    description:
      "Find sportswear, activewear, jackets, track sets, and casual performance fashion for shoppers in Nepal.",
    keywords: ["sportswear Nepal", "activewear Nepal", "sports jacket Nepal"],
  },
  accessories: {
    slug: "accessories",
    category: "Accessories",
    title: "Fashion Accessories in Nepal",
    description:
      "Shop fashion accessories, finishing pieces, and everyday style essentials from Nepal-based stores.",
    keywords: ["fashion accessories Nepal", "accessories online Nepal"],
  },
  footwear: {
    slug: "footwear",
    category: "Footwear",
    title: "Footwear in Nepal",
    description:
      "Browse shoes, sneakers, sandals, and fashion footwear from trusted Nepal stores on FitBazar.",
    keywords: ["footwear Nepal", "shoes online Nepal", "sneakers Nepal"],
  },
  sale: {
    slug: "sale",
    title: "Fashion Sale in Nepal",
    description:
      "Shop discounted clothing, footwear, accessories, and seasonal fashion offers from trusted Nepal stores.",
    keywords: ["fashion sale Nepal", "clothing sale Nepal", "online shopping deals Nepal"],
    minDiscount: 20,
  },
  oversizedTshirtsNepal: {
    slug: "oversized-tshirts-nepal",
    title: "Oversized T-Shirts Nepal",
    description:
      "Shop oversized t-shirts in Nepal for relaxed streetwear fits, everyday casual outfits, and easy layering from trusted FitBazar sellers.",
    keywords: ["oversized t-shirts Nepal", "oversized tshirts Nepal", "loose fit t-shirt Nepal", "streetwear t-shirt Nepal"],
    matchAll: [
      ["oversized", "loose fit", "relaxed fit"],
      ["tshirt", "t-shirt", "tee", "t shirt"],
    ],
    relatedCollections: ["streetwear-nepal", "mens-fashion-nepal", "womens-fashion-nepal", "hoodies-nepal"],
    faq: [
      {
        question: "Where can I buy oversized t-shirts in Nepal?",
        answer: "You can browse oversized t-shirts on FitBazar from Nepal-based fashion sellers with product images, prices, and store links.",
      },
      {
        question: "Are oversized t-shirts good for streetwear outfits?",
        answer: "Yes. Oversized t-shirts pair well with hoodies, jackets, cargo pants, sneakers, and other casual streetwear pieces.",
      },
      {
        question: "How should I choose an oversized t-shirt size?",
        answer: "Check the product size options and description. For a relaxed fit, many shoppers choose their usual size; for a baggier look, they size up if stock allows.",
      },
    ],
  },
  streetwearNepal: {
    slug: "streetwear-nepal",
    title: "Streetwear Nepal",
    description:
      "Discover streetwear in Nepal including oversized t-shirts, hoodies, jackets, casual layers, sneakers, and trend-led fashion on FitBazar.",
    keywords: ["streetwear Nepal", "urban fashion Nepal", "street style Nepal", "oversized fashion Nepal"],
    matchAll: [["streetwear", "street wear", "street style", "urban", "oversized", "hoodie", "hoodies", "cargo"]],
    relatedCollections: ["oversized-tshirts-nepal", "hoodies-nepal", "mens-fashion-nepal", "footwear"],
    faq: [
      {
        question: "What is included in FitBazar streetwear Nepal?",
        answer: "The streetwear collection surfaces oversized tees, hoodies, casual jackets, sneakers, and urban-inspired fashion available from FitBazar sellers.",
      },
      {
        question: "Can I shop streetwear for men and women in Nepal?",
        answer: "Yes. Streetwear products can include men's, women's, and unisex styles depending on the sellers and current stock.",
      },
      {
        question: "Which collections pair well with streetwear?",
        answer: "Oversized t-shirts, hoodies, footwear, sale products, and men's fashion collections are useful internal links for streetwear shoppers.",
      },
    ],
  },
  hoodiesNepal: {
    slug: "hoodies-nepal",
    title: "Hoodies Nepal",
    description:
      "Shop hoodies in Nepal for casual layering, streetwear outfits, cool-weather comfort, and everyday fashion from trusted FitBazar stores.",
    keywords: ["hoodies Nepal", "hoodie online Nepal", "men hoodies Nepal", "women hoodies Nepal", "streetwear hoodies Nepal"],
    matchAll: [["hoodie", "hoodies", "sweatshirt", "sweatshirts", "pullover"]],
    relatedCollections: ["streetwear-nepal", "oversized-tshirts-nepal", "mens-fashion-nepal", "womens-fashion-nepal"],
    faq: [
      {
        question: "Where can I buy hoodies online in Nepal?",
        answer: "FitBazar lists hoodies and casual layering pieces from Nepal fashion sellers with product pages, prices, images, and related items.",
      },
      {
        question: "Are hoodies available for streetwear outfits?",
        answer: "Yes. Hoodies are a core streetwear layer and pair well with oversized t-shirts, sneakers, joggers, and jackets.",
      },
      {
        question: "Do hoodie listings show sizes and colors?",
        answer: "When sellers provide them, FitBazar product pages show available sizes, colors, stock, images, prices, and store information.",
      },
    ],
  },
} as const;

export type CollectionSlug = keyof typeof collectionDefinitions;

export function absoluteUrl(path = "/") {
  try {
    return new URL(path, siteConfig.url).toString();
  } catch {
    return siteConfig.url;
  }
}

export function canonicalUrl(path = "/") {
  const url = new URL(path, siteConfig.url);
  url.hash = "";
  return url.toString();
}

export function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateSeo(value: string, maxLength = 155) {
  const normalized = stripHtml(value);
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : clipped.length).trim()}...`;
}

export function collectionPathForCategory(category: string) {
  const slug = categorySlug(category);
  if (slug === "men") return "/collections/mens-fashion-nepal";
  if (slug === "women") return "/collections/womens-fashion-nepal";
  if (slug === "sports") return "/collections/sportswear";
  if (slug === "ethnic-wear") return "/collections/ethnic";
  return `/collections/${slug}`;
}

export function getCollectionDefinition(slug: string) {
  const normalized = slug.toLowerCase();
  if (normalized === "sports") return collectionDefinitions.sportswear;
  if (normalized === "ethnic-wear") return collectionDefinitions.ethnic;
  return collectionDefinitions[normalized as CollectionSlug];
}

export function buildCollectionMetadata(definition: {
  slug: string;
  title: string;
  description: string;
  keywords?: readonly string[];
}): Metadata {
  const path = `/collections/${definition.slug}`;
  return {
    title: definition.title,
    description: definition.description,
    keywords: [...siteConfig.keywords, ...(definition.keywords ?? [])],
    alternates: {
      canonical: canonicalUrl(path),
    },
    openGraph: {
      url: canonicalUrl(path),
      title: `${definition.title} | FitBazar`,
      description: definition.description,
    },
    twitter: {
      title: `${definition.title} | FitBazar`,
      description: definition.description,
    },
  };
}

export function buildNoIndexMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(path),
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
    openGraph: {
      url: canonicalUrl(path),
      title: `${title} | FitBazar`,
      description,
    },
    twitter: {
      title: `${title} | FitBazar`,
      description,
    },
  };
}

export function productSeoDescription(product: {
  name: string;
  description?: string | null;
  category?: string | null;
  vendor?: { shopName?: string | null } | null;
}) {
  const description = stripHtml(product.description);
  if (description) return truncateSeo(description);

  const category = product.category ? normalizeCategory(product.category) : "fashion";
  const vendor = product.vendor?.shopName ? ` from ${product.vendor.shopName}` : "";
  return truncateSeo(`Shop ${product.name}${vendor} on FitBazar. Discover ${category.toLowerCase()} online in Nepal with trusted sellers, clear pricing, and mobile-first checkout.`);
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: ["Fit Bazar", "Fit Bazzar"],
    url: siteConfig.url,
    logo: absoluteUrl(siteConfig.icon),
    sameAs: [siteConfig.social.instagram, siteConfig.social.facebook],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        areaServed: "NP",
        availableLanguage: ["en", "ne"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "NP",
      addressLocality: "Kathmandu",
    },
    areaServed: {
      "@type": "Country",
      name: "Nepal",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path ? canonicalUrl(item.path) : undefined,
    })),
  };
}

export function itemListJsonLd(
  items: Array<{ name: string; path: string; image?: string | null }>,
  name: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: canonicalUrl(item.path),
      name: item.name,
      image: item.image ? absoluteUrl(item.image) : undefined,
    })),
  };
}

export function faqJsonLd(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function productJsonLd(product: ProductSchemaInput) {
  const reviews = product.reviews ?? [];
  const reviewCount = product.reviewCount ?? reviews.length;
  const averageRating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : null;
  const productUrl = canonicalUrl(`/products/${product.slug}`);
  const description = productSeoDescription(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description,
    sku: product.id,
    category: product.category,
    image: product.images.length ? product.images.map((image) => absoluteUrl(image)) : [absoluteUrl(siteConfig.ogImage)],
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: product.vendor?.shopName || siteConfig.name,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "NPR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: product.vendor?.shopName || siteConfig.name,
      },
    },
    aggregateRating:
      averageRating && reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount,
          }
        : undefined,
    review: reviews
      .filter((review) => review.comment)
      .slice(0, 5)
      .map((review) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
        },
        author: {
          "@type": "Person",
          name: review.user?.name || "FitBazar shopper",
        },
        datePublished: new Date(review.createdAt).toISOString(),
        reviewBody: review.comment,
      })),
  };
}
