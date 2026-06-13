import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicProductVisibilityFilter } from "@/lib/public-storefront";
import { pickBestProductLookupCandidate, publicProductAliasWhere, publicProductIdentityWhere } from "@/lib/product-lookup";
import { PUBLIC_CATALOG_REVALIDATE_SECONDS, publicCatalogCacheHeaders } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_CATALOG_REVALIDATE_SECONDS;

const publicProductDetailInclude = {
  vendor: {
    select: {
      id: true,
      shopName: true,
      slug: true,
      logo: true,
      description: true,
      category: true,
    },
  },
  reviews: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  _count: {
    select: {
      reviews: true,
    },
  },
} satisfies Prisma.ProductInclude;

function findPublicProductDetail(
  where: Prisma.ProductWhereInput,
  orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[],
) {
  return prisma.product.findFirst({
    where,
    include: publicProductDetailInclude,
    ...(orderBy ? { orderBy } : {}),
  });
}

async function queryPublicProductDetail(identifier: string) {
  let product = await findPublicProductDetail(publicProductIdentityWhere(identifier));

  if (!product) {
    const aliasWhere = publicProductAliasWhere(identifier);
    product = aliasWhere
      ? await findPublicProductDetail(aliasWhere, [{ totalSold: "desc" }, { createdAt: "desc" }])
      : null;
  }

  if (!product) {
    const candidates = await prisma.product.findMany({
      where: publicProductVisibilityFilter,
      include: publicProductDetailInclude,
      orderBy: [{ totalSold: "desc" }, { createdAt: "desc" }],
      take: 80,
    });
    product = pickBestProductLookupCandidate(identifier, candidates);
  }

  if (!product) return null;

  const similarProducts = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      ...publicProductVisibilityFilter,
      category: product.category,
    },
    include: {
      vendor: {
        select: {
          id: true,
          shopName: true,
          slug: true,
          logo: true,
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
    orderBy: [{ totalSold: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  const alsoBoughtProducts = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      ...publicProductVisibilityFilter,
      vendorId: { not: product.vendorId },
    },
    include: {
      vendor: {
        select: {
          id: true,
          shopName: true,
          slug: true,
          logo: true,
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
    orderBy: [{ totalSold: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  return {
    product,
    similarProducts,
    alsoBoughtProducts,
  };
}

function getCachedPublicProductDetail(slug: string) {
  return unstable_cache(() => queryPublicProductDetail(slug), ["public-product-api", slug], {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-product-detail"],
  })();
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const data = await getCachedPublicProductDetail(slug);

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: publicCatalogCacheHeaders(PUBLIC_CATALOG_REVALIDATE_SECONDS),
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
