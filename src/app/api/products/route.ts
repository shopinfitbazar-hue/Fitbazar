import { NextResponse } from "next/server";
import {
  getCachedPublicProducts,
  parsePublicProductQuery,
  publicCatalogCacheHeaders,
  PUBLIC_CATALOG_REVALIDATE_SECONDS,
} from "@/lib/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_CATALOG_REVALIDATE_SECONDS;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = parsePublicProductQuery(searchParams);
    const data = await getCachedPublicProducts(input);

    return NextResponse.json(data, {
      headers: publicCatalogCacheHeaders(PUBLIC_CATALOG_REVALIDATE_SECONDS),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
