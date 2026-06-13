import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CATALOG_REVALIDATE_SECONDS, publicCatalogCacheHeaders } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_CATALOG_REVALIDATE_SECONDS;

const getCachedCategories = unstable_cache(
  () =>
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
    }),
  ["public-categories"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-categories"],
  },
);

export async function GET() {
  try {
    const categories = await getCachedCategories();

    return NextResponse.json(
      { categories },
      {
        headers: publicCatalogCacheHeaders(PUBLIC_CATALOG_REVALIDATE_SECONDS),
      },
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
