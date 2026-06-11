import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCachedPublicSearch,
  parsePublicSearchQuery,
  publicCatalogCacheHeaders,
  PUBLIC_SEARCH_REVALIDATE_SECONDS,
} from "@/lib/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_SEARCH_REVALIDATE_SECONDS;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = parsePublicSearchQuery(searchParams);
    const data = await getCachedPublicSearch(input);

    if (input.q) {
      void prisma.searchLog
        .create({
          data: {
            query: input.q,
            results: data.total + data.vendors.length,
          },
        })
        .catch(() => undefined);
    }

    return NextResponse.json(data, {
      headers: publicCatalogCacheHeaders(PUBLIC_SEARCH_REVALIDATE_SECONDS),
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
