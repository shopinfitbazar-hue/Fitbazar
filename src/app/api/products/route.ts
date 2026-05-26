import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { normalizeCategory } from "@/lib/categories";
import { publicProductVisibilityFilter } from "@/lib/public-storefront";

export const dynamic = "force-dynamic";

function clampNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const sort = searchParams.get("sort") || "newest";
    const tag = searchParams.get("tag");
    const category = normalizeCategory(searchParams.get("category"));
    const minDiscount = searchParams.get("minDiscount");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const size = searchParams.getAll("size");
    const color = searchParams.getAll("color");
    const q = searchParams.get("q")?.trim().slice(0, 80);
    const limit = clampNumber(searchParams.get("limit"), 12, 1, 48);
    const page = clampNumber(searchParams.get("page"), 1, 1, 500);
    const featured = searchParams.get("featured");
    
    // Build where clause
    const where: Prisma.ProductWhereInput = {
      ...publicProductVisibilityFilter,
    };

    if (category) where.category = category;
    if (tag === "festival_sale") where.isFestivalSale = true;
    else if (tag === "year_round_sale") where.isYearRoundSale = true;
    if (featured === "true") where.isFeatured = true;
    if (minDiscount) where.discountPct = { gte: clampNumber(minDiscount, 0, 0, 95) };
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: Math.max(0, Number.parseFloat(minPrice) || 0) } : {}),
        ...(maxPrice ? { lte: Math.min(500000, Math.max(0, Number.parseFloat(maxPrice) || 0)) } : {}),
      };
    }
    if (size.length > 0) {
      where.sizes = {
        hasSome: size,
      };
    }
    if (color.length > 0) {
      where.colors = {
        hasSome: color,
      };
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [q.toLowerCase()] } },
      ];
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "totalSold" || sort === "popularity") orderBy = { totalSold: "desc" };
    else if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "discount") orderBy = { discountPct: "desc" };

    const [products, total, facets] = await Promise.all([
      prisma.product.findMany({
        where,
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
      }),
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: {
          ...publicProductVisibilityFilter,
        },
        select: {
          category: true,
          sizes: true,
          colors: true,
        },
        take: 500,
      }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        categories: Array.from(new Set(facets.map((item) => item.category).filter(Boolean))).sort(),
        sizes: Array.from(new Set(facets.flatMap((item) => item.sizes))).sort(),
        colors: Array.from(new Set(facets.flatMap((item) => item.colors))).sort(),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
