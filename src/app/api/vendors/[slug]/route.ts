import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicVendorVisibilityFilter } from "@/lib/public-storefront";
import { ProductStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "popular";

    const vendor = await prisma.vendor.findFirst({
      where: {
        slug,
        ...publicVendorVisibilityFilter,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: { rating: true, comment: true, createdAt: true, user: { select: { name: true, image: true } } },
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

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const orderBy =
      sort === "price_asc"
        ? [{ price: "asc" as const }]
        : sort === "price_desc"
          ? [{ price: "desc" as const }]
          : sort === "newest"
            ? [{ createdAt: "desc" as const }]
            : [{ totalSold: "desc" as const }, { createdAt: "desc" as const }];

    const products = await prisma.product.findMany({
      where: {
        vendorId: vendor.id,
        status: ProductStatus.ACTIVE,
        ...(category ? { category } : {}),
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
      orderBy,
    });

    return NextResponse.json({ vendor, products });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
  }
}
