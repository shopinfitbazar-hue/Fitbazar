import { NextResponse } from "next/server";
import {
  getCachedPublicVendors,
  parsePublicVendorQuery,
  publicCatalogCacheHeaders,
  PUBLIC_VENDOR_REVALIDATE_SECONDS,
} from "@/lib/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_VENDOR_REVALIDATE_SECONDS;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = parsePublicVendorQuery(searchParams);
    const data = await getCachedPublicVendors(input);

    return NextResponse.json(data, {
      headers: publicCatalogCacheHeaders(PUBLIC_VENDOR_REVALIDATE_SECONDS),
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
