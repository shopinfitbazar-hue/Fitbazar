import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { slugify } from "@/lib/slug";
import { deriveProductStatus } from "@/lib/product-status";
import { removeOrDiscontinueProduct } from "@/lib/product-deletion";

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as { isFeatured?: boolean; isActive?: boolean; status?: string };

    let nextStatus = body.status;
    if (!nextStatus && body.isActive !== undefined) {
      nextStatus = body.isActive ? "ACTIVE" : "HIDDEN";
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
        ...(nextStatus !== undefined
          ? {
              status: deriveProductStatus({
                requestedStatus: nextStatus,
                stock: (
                  await prisma.product.findUnique({
                    where: { id },
                    select: { stock: true },
                  })
                )?.stock ?? 0,
                isActive: body.isActive,
              }),
            }
          : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error updating admin product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await params;
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

    const existing = await prisma.product.findUnique({
      where: { id },
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

    const nextStock = body.stock !== undefined ? Number(body.stock) : undefined;
    const current = await prisma.product.findUnique({
      where: { id },
      select: { stock: true, status: true, isActive: true },
    });

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
        ...(body.vendorId !== undefined ? { vendorId: body.vendorId } : {}),
        ...(body.name !== undefined ? { name: body.name.trim(), slug: await buildUniqueSlug(body.name, id) } : {}),
        ...(body.category !== undefined ? { category: body.category.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
        ...(discountPct !== undefined ? { discountPct } : {}),
        ...(body.stock !== undefined ? { stock: nextStock } : {}),
        ...(body.sizes !== undefined ? { sizes: body.sizes.filter(Boolean) } : {}),
        ...(body.colors !== undefined ? { colors: body.colors.filter(Boolean) } : {}),
        ...(body.images !== undefined ? { images: body.images.filter(Boolean) } : {}),
        ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
        ...(body.isFestivalSale !== undefined ? { isFestivalSale: body.isFestivalSale } : {}),
        ...(body.isYearRoundSale !== undefined ? { isYearRoundSale: body.isYearRoundSale } : {}),
        ...(status !== undefined ? { status, isActive: status === "ACTIVE" } : {}),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error updating admin product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await params;
    const result = await removeOrDiscontinueProduct(id);

    if (!result) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error deleting admin product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
