import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { publicProductVisibilityFilter } from "@/lib/public-storefront";
import { publicProductAliasWhere, publicProductIdentityWhere } from "@/lib/product-lookup";
import { PUBLIC_CATALOG_REVALIDATE_SECONDS, publicCatalogCacheHeaders } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_CATALOG_REVALIDATE_SECONDS;

async function queryPublicProductDetail(identifier: string) {
  const product = await prisma.product.findFirst({
    where: publicProductIdentityWhere(identifier),
    include: {
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
    },
  }) ?? (await (async () => {
    const aliasWhere = publicProductAliasWhere(identifier);
    if (!aliasWhere) return null;

    return prisma.product.findFirst({
      where: aliasWhere,
      include: {
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
      },
      orderBy: [{ totalSold: "desc" }, { createdAt: "desc" }],
    });
  })());

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
