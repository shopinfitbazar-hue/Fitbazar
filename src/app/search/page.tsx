import type { Metadata } from "next";
import SearchPageClient from "@/components/SearchPageClient";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/config/site";
import { breadcrumbJsonLd, buildNoIndexMetadata, canonicalUrl, truncateSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
};

async function resolveSearchParams(searchParams?: SearchParams | Promise<SearchParams>) {
  return (await searchParams) ?? {};
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await resolveSearchParams(searchParams);
  const query = params.q?.trim().slice(0, 80);
  const path = query ? `/search?q=${encodeURIComponent(query)}` : "/search";

  return buildMetadata(
    buildNoIndexMetadata(
      query ? `Search Results for ${query}` : "Search Fashion in Nepal",
      truncateSeo(
        query
          ? `Search FitBazar for ${query}. Find fashion products and trusted stores across Nepal.`
          : "Search FitBazar for clothing, shoes, ethnic wear, sportswear, accessories, and trusted fashion stores in Nepal.",
      ),
      canonicalUrl(path),
    ),
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const params = await resolveSearchParams(searchParams);
  const query = params.q?.trim();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Search", path: query ? `/search?q=${encodeURIComponent(query)}` : "/search" },
        ])}
      />
      <SearchPageClient />
    </>
  );
}
