import type { Metadata } from "next";
import ProductsPageClient from "@/components/ProductsPageClient";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/config/site";
import { normalizeCategory } from "@/lib/categories";
import {
  breadcrumbJsonLd,
  buildCollectionMetadata,
  buildNoIndexMetadata,
  canonicalUrl,
  collectionDefinitions,
  collectionPathForCategory,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type ProductsSearchParams = {
  category?: string;
  minDiscount?: string;
  sort?: string;
  size?: string | string[];
  color?: string | string[];
  maxPrice?: string;
};

async function resolveSearchParams(searchParams?: ProductsSearchParams | Promise<ProductsSearchParams>) {
  return (await searchParams) ?? {};
}

function hasRefiningFilters(searchParams: ProductsSearchParams) {
  return Boolean(searchParams.size || searchParams.color || searchParams.maxPrice);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: ProductsSearchParams | Promise<ProductsSearchParams>;
}): Promise<Metadata> {
  const params = await resolveSearchParams(searchParams);
  const category = normalizeCategory(params.category);
  const minDiscount = Number.parseInt(params.minDiscount || "", 10);

  if (category) {
    const path = collectionPathForCategory(category);
    const title = `${category} Online Shopping in Nepal`;
    const description = `Shop ${category.toLowerCase()} online in Nepal from trusted FitBazar fashion stores. Browse prices, sizes, colors, and mobile-friendly checkout.`;
    return buildMetadata({
      ...buildCollectionMetadata({
        slug: path.replace("/collections/", ""),
        title,
        description,
        keywords: [`${category} Nepal`, `${category} online shopping Nepal`, "FitBazar"],
      }),
      robots: hasRefiningFilters(params)
        ? {
            index: false,
            follow: true,
            googleBot: { index: false, follow: true },
          }
        : undefined,
    });
  }

  if (Number.isFinite(minDiscount) && minDiscount >= 20) {
    return buildMetadata({
      ...buildCollectionMetadata(collectionDefinitions.sale),
      robots: hasRefiningFilters(params)
        ? {
            index: false,
            follow: true,
            googleBot: { index: false, follow: true },
          }
        : undefined,
    });
  }

  if (hasRefiningFilters(params)) {
    return buildMetadata(
      buildNoIndexMetadata(
        "Filtered Fashion Products",
        "Browse filtered fashion products on FitBazar with trusted sellers across Nepal.",
        "/products",
      ),
    );
  }

  return buildMetadata({
    title: "Fashion Products Online in Nepal",
    description:
      "Browse men's, women's, kids', ethnic, sportswear, footwear, and accessories from trusted Nepal fashion stores on FitBazar.",
    alternates: {
      canonical: canonicalUrl("/products"),
    },
    openGraph: {
      url: canonicalUrl("/products"),
      title: "Fashion Products Online in Nepal | FitBazar",
      description:
        "Browse men's, women's, kids', ethnic, sportswear, footwear, and accessories from trusted Nepal fashion stores on FitBazar.",
    },
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: ProductsSearchParams | Promise<ProductsSearchParams>;
}) {
  const params = await resolveSearchParams(searchParams);
  const category = normalizeCategory(params.category);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          ...(category ? [{ name: category, path: collectionPathForCategory(category) }] : []),
        ])}
      />
      <ProductsPageClient />
    </>
  );
}
