import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { publicVendorVisibilityFilter } from "@/lib/public-storefront";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");

    const vendorWhere: Prisma.VendorWhereInput = {
      ...publicVendorVisibilityFilter,
    };

    const vendors = await prisma.vendor.findMany({
      where: vendorWhere,
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: { rating: true },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        products: {
          _count: "desc",
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.vendor.count({ where: vendorWhere });

    return NextResponse.json({ vendors, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
