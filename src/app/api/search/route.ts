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

const SEARCH_LOG_SAMPLE_RATE = (() => {
  const parsed = Number(process.env.SEARCH_LOG_SAMPLE_RATE ?? "0.05");
  if (!Number.isFinite(parsed)) return 0.05;
  return Math.min(1, Math.max(0, parsed));
})();

function shouldWriteSearchLog() {
  return SEARCH_LOG_SAMPLE_RATE >= 1 || Math.random() < SEARCH_LOG_SAMPLE_RATE;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = parsePublicSearchQuery(searchParams);
    const data = await getCachedPublicSearch(input);

    if (input.q && shouldWriteSearchLog()) {
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
