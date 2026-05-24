import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { normalizeCategory } from "@/lib/categories";
import { publicProductVisibilityFilter, publicVendorVisibilityFilter } from "@/lib/public-storefront";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = normalizeCategory(searchParams.get("category"));
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const rating = searchParams.get("rating");
    const inStock = searchParams.get("inStock");
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    
    if (!query) {
      return NextResponse.json({
        products: [],
        vendors: [],
        categories: [],
        total: 0,
      });
    }

    // Log search query
    const whereClause: Prisma.ProductWhereInput = {
      ...publicProductVisibilityFilter,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query.toLowerCase()] } },
      ],
    };

    if (category) whereClause.category = category;
    if (minPrice) whereClause.price = { gte: parseFloat(minPrice) };
    if (maxPrice) whereClause.price = { ...whereClause.price as object, lte: parseFloat(maxPrice) };
    if (size) whereClause.sizes = { has: size };
    if (color) whereClause.colors = { has: color };
    if (rating) whereClause.reviews = { some: { rating: { gte: parseInt(rating) } } };
    if (inStock === "true") whereClause.stock = { gt: 0 };
    if (tag === "festival_sale") whereClause.isFestivalSale = true;
    else if (tag === "year_round_sale") whereClause.isYearRoundSale = true;

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "totalSold") orderBy = { totalSold: "desc" };
    else if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "rating") orderBy = { reviews: { _count: "desc" } };

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    const total = await prisma.product.count({ where: whereClause });

    // Search vendors
    const vendors = await prisma.vendor.findMany({
      where: {
        ...publicVendorVisibilityFilter,
        OR: [
          { shopName: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        shopName: true,
        slug: true,
        logo: true,
        category: true,
      },
    });

    // Get matching categories
    const categories = await prisma.category.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    });

    await prisma.searchLog.create({
      data: {
        query,
        results: total + vendors.length,
      },
    }).catch(() => {});

    return NextResponse.json({
      products,
      vendors,
      categories,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
