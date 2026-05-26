import { NextResponse } from "next/server";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { renderVendorUpdateEmail } from "@/lib/email-templates";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { removeOrDiscontinueProduct } from "@/lib/product-deletion";
import { requireVendorSession } from "@/lib/server-auth";
import { slugify } from "@/lib/slug";

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

    if (body.description !== undefined && !body.description.trim()) {
      return NextResponse.json({ error: "A vendor-written product description is required." }, { status: 400 });
    }

    if (body.images !== undefined && !body.images.filter(Boolean).length) {
      return NextResponse.json({ error: "At least one product image is required." }, { status: 400 });
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
        status: "DRAFT",
        isActive: false,
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Product update awaiting approval",
          message: `${vendor.shopName} updated ${product.name}. Review it before it goes live.`,
          type: "PRODUCT",
          link: "/admin#products",
        })),
      }).catch(() => undefined);
    }

    if (hasConfiguredMailTransport()) {
      await sendMail({
        to: admins.map((admin) => admin.email),
        from: process.env.VENDOR_SUPPORT_EMAIL_FROM || "vendorSupport@fitbazar.com",
        subject: `Product update awaiting approval: ${product.name}`,
        text: `${vendor.shopName} updated ${product.name}. Review it before it goes live.`,
        html: renderVendorUpdateEmail(
          "Admin",
          "Product update awaiting approval",
          `${vendor.shopName} updated ${product.name}. Review it before it goes live.`,
          buildAbsoluteAppUrl("/admin#products"),
        ),
      }).catch(() => undefined);
    }

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

    const result = await removeOrDiscontinueProduct(id);

    if (!result) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error deleting vendor product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
