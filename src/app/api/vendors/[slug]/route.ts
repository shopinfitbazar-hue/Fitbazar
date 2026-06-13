import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { publicProductVisibilityFilter, publicVendorVisibilityFilter } from "@/lib/public-storefront";
import { PUBLIC_VENDOR_REVALIDATE_SECONDS, publicCatalogCacheHeaders } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_VENDOR_REVALIDATE_SECONDS;

function buildVendorProductOrderBy(sort: string) {
  if (sort === "price_asc") return [{ price: "asc" as const }];
  if (sort === "price_desc") return [{ price: "desc" as const }];
  if (sort === "newest") return [{ createdAt: "desc" as const }];
  return [{ totalSold: "desc" as const }, { createdAt: "desc" as const }];
}

async function queryPublicVendorDetail(slug: string, category: string | null, sort: string) {
  const vendor = await prisma.vendor.findFirst({
    where: {
      slug,
      ...publicVendorVisibilityFilter,
      isPartnered: true,
    },
    select: {
      id: true,
      shopName: true,
      slug: true,
      logo: true,
      banner: true,
      description: true,
      category: true,
      zone: true,
      district: true,
      isPartnered: true,
      isTopShop: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      reviews: {
        where: { isVisible: true },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      },
      _count: {
        select: {
          products: true,
          orders: true,
          reviews: true,
        },
      },
    },
  });

  if (!vendor) return null;

  const products = await prisma.product.findMany({
    where: {
      ...publicProductVisibilityFilter,
      vendorId: vendor.id,
      ...(category ? { category } : {}),
    },
    include: {
      vendor: {
        select: {
          id: true,
          shopName: true,
          slug: true,
          logo: true,
          isPartnered: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: buildVendorProductOrderBy(sort),
    take: 48,
  });

  return { vendor, products };
}

function getCachedPublicVendorDetail(slug: string, category: string | null, sort: string) {
  return unstable_cache(
    () => queryPublicVendorDetail(slug, category, sort),
    ["public-vendor-api", slug, category || "all", sort],
    {
      revalidate: PUBLIC_VENDOR_REVALIDATE_SECONDS,
      tags: ["public-vendors"],
    },
  )();
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "popular";
    const data = await getCachedPublicVendorDetail(slug, category, sort);

    if (!data) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: publicCatalogCacheHeaders(PUBLIC_VENDOR_REVALIDATE_SECONDS),
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
  }
}
