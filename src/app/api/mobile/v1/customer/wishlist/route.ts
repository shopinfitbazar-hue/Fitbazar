import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSafeImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/media";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { getPublicVendorName, getPublicVendorSlug } from "@/lib/public-vendor-identity";

export const dynamic = "force-dynamic";

function averageRating(reviews: Array<{ rating: number }>) {
  if (!reviews.length) return undefined;
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

function serializeWishlistItem(item: {
  id: string;
  createdAt: Date;
  product: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    price: number;
    compareAtPrice: number | null;
    images: string[];
    category: string;
    sizes: string[];
    colors: string[];
    stock: number;
    totalSold: number;
    vendor: {
      id: string;
      shopName: string;
      slug: string;
      logo: string | null;
      category: string | null;
      isPartnered: boolean;
    };
    reviews: Array<{ rating: number }>;
    _count: { reviews: number };
  };
}) {
  const { product } = item;
  const compareAtPrice = product.compareAtPrice ?? undefined;
  const discountPct =
    compareAtPrice && compareAtPrice > product.price
      ? Math.round(((compareAtPrice - product.price) / compareAtPrice) * 100)
      : undefined;

  return {
    id: item.id,
    createdAt: item.createdAt,
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice,
      discountPct,
      images: product.images.length ? product.images.map((image) => getSafeImageUrl(image, FALLBACK_PRODUCT_IMAGE)) : [FALLBACK_PRODUCT_IMAGE],
      category: product.category,
      sizes: product.sizes,
      colors: product.colors,
      stock: product.stock,
      totalSold: product.totalSold,
      reviewCount: product._count.reviews,
      averageRating: averageRating(product.reviews),
      vendor: {
        id: product.vendor.id,
        shopName: getPublicVendorName(product.vendor),
        slug: getPublicVendorSlug(product.vendor) ?? null,
        logo: product.vendor.isPartnered ? product.vendor.logo : null,
        category: product.vendor.category,
        isPartnered: product.vendor.isPartnered,
      },
    },
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: auth.user.id },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                id: true,
                shopName: true,
                slug: true,
                logo: true,
                category: true,
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      wishlist: wishlist.map(serializeWishlistItem),
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching mobile wishlist:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const body = (await request.json()) as { productId?: string };

    if (!body.productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: body.productId,
        status: "ACTIVE",
        vendor: {
          isApproved: true,
          isSuspended: false,
        },
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product is not available." }, { status: 404 });
    }

    const item = await prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId: auth.user.id,
          productId: body.productId,
        },
      },
      update: {},
      create: {
        userId: auth.user.id,
        productId: body.productId,
      },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                id: true,
                shopName: true,
                slug: true,
                logo: true,
                category: true,
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
        },
      },
    });

    return NextResponse.json({ item: serializeWishlistItem(item) }, { status: 201 });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error adding mobile wishlist item:", error);
    return NextResponse.json({ error: "Failed to add wishlist item." }, { status: 500 });
  }
}
