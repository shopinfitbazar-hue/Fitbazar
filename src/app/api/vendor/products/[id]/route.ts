import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";
import { slugify } from "@/lib/slug";
import { deriveProductStatus } from "@/lib/product-status";

export const dynamic = "force-dynamic";

async function buildUniqueSlug(name: string, excludeId: string) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug,
        id: { not: excludeId },
      },
      select: { id: true },
    });

    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireVendorSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor } = auth;
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      category?: string;
      price?: number;
      compareAtPrice?: number;
      stock?: number;
      sizes?: string[];
      colors?: string[];
      tags?: string[];
      images?: string[];
      isFestivalSale?: boolean;
      isYearRoundSale?: boolean;
      isActive?: boolean;
      status?: string;
    };

    const existing = await prisma.product.findFirst({
      where: { id, vendorId: vendor.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const price = body.price !== undefined ? Number(body.price) : undefined;
    const compareAtPrice =
      body.compareAtPrice !== undefined
        ? body.compareAtPrice && price !== undefined && body.compareAtPrice > price
          ? body.compareAtPrice
          : null
        : undefined;
    const discountPct =
      price !== undefined && compareAtPrice
        ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
        : undefined;

    const current = await prisma.product.findFirst({
      where: { id, vendorId: vendor.id },
      select: { stock: true, status: true, isActive: true },
    });

    const nextStock = body.stock !== undefined ? Number(body.stock) : undefined;
    const status =
      body.status !== undefined || body.isActive !== undefined || nextStock !== undefined
        ? deriveProductStatus({
            requestedStatus: body.status ?? current?.status,
            stock: nextStock ?? current?.stock ?? 0,
            isActive: body.isActive ?? current?.isActive,
          })
        : undefined;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim(), slug: await buildUniqueSlug(body.name, id) } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(body.category !== undefined ? { category: body.category.trim() } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
        ...(discountPct !== undefined ? { discountPct } : {}),
        ...(body.stock !== undefined ? { stock: nextStock } : {}),
        ...(body.sizes !== undefined ? { sizes: body.sizes.filter(Boolean) } : {}),
        ...(body.colors !== undefined ? { colors: body.colors.filter(Boolean) } : {}),
        ...(body.tags !== undefined ? { tags: body.tags.filter(Boolean) } : {}),
        ...(body.images !== undefined ? { images: body.images.filter(Boolean) } : {}),
        ...(body.isFestivalSale !== undefined ? { isFestivalSale: body.isFestivalSale } : {}),
        ...(body.isYearRoundSale !== undefined ? { isYearRoundSale: body.isYearRoundSale } : {}),
        ...(status !== undefined ? { status, isActive: status === "ACTIVE" } : {}),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error updating vendor product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireVendorSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor } = auth;
    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, vendorId: vendor.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vendor product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
