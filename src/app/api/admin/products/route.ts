import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { slugify } from "@/lib/slug";
import { deriveProductStatus } from "@/lib/product-status";

export const dynamic = "force-dynamic";

async function buildUniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const products = await prisma.product.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { vendor: { shopName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : undefined,
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const body = (await request.json()) as {
      vendorId?: string;
      name?: string;
      category?: string;
      price?: number;
      compareAtPrice?: number;
      stock?: number;
      description?: string;
      sizes?: string[];
      colors?: string[];
      images?: string[];
      isFeatured?: boolean;
      isFestivalSale?: boolean;
      isYearRoundSale?: boolean;
      isActive?: boolean;
      status?: string;
    };

    if (!body.vendorId || !body.name || !body.category || body.price === undefined) {
      return NextResponse.json({ error: "Missing required product fields." }, { status: 400 });
    }

    if (!body.images?.filter(Boolean).length) {
      return NextResponse.json({ error: "At least one product image is required." }, { status: 400 });
    }

    const compareAtPrice = body.compareAtPrice && body.compareAtPrice > body.price ? body.compareAtPrice : null;
    const discountPct = compareAtPrice ? Math.round(((compareAtPrice - body.price) / compareAtPrice) * 100) : 0;
    const slug = await buildUniqueSlug(body.name);
    const stock = Number(body.stock || 0);
    const status = deriveProductStatus({
      requestedStatus: body.status,
      stock,
      isActive: body.isActive ?? true,
    });

    const product = await prisma.product.create({
      data: {
        vendorId: body.vendorId,
        name: body.name.trim(),
        slug,
        category: body.category.trim(),
        description: body.description?.trim() || "",
        price: Number(body.price),
        compareAtPrice,
        discountPct,
        stock,
        sizes: body.sizes?.filter(Boolean) || [],
        colors: body.colors?.filter(Boolean) || [],
        images: body.images.filter(Boolean),
        isFeatured: Boolean(body.isFeatured),
        isFestivalSale: Boolean(body.isFestivalSale),
        isYearRoundSale: Boolean(body.isYearRoundSale),
        isActive: status === "ACTIVE",
        status,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
