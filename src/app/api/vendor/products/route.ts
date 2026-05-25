import { NextResponse } from "next/server";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { renderVendorUpdateEmail } from "@/lib/email-templates";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";
import { slugify } from "@/lib/slug";

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
    const auth = await requireVendorSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor } = auth;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const products = await prisma.product.findMany({
      where: {
        vendorId: vendor.id,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products, vendor });
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return NextResponse.json({ error: "Failed to fetch vendor products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireVendorSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor } = auth;
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

    if (!body.name || !body.category || body.price === undefined) {
      return NextResponse.json({ error: "Missing required product fields" }, { status: 400 });
    }

    if (!body.images?.filter(Boolean).length) {
      return NextResponse.json({ error: "At least one product image is required." }, { status: 400 });
    }

    const compareAtPrice = body.compareAtPrice && body.compareAtPrice > body.price ? body.compareAtPrice : null;
    const discountPct = compareAtPrice ? Math.round(((compareAtPrice - body.price) / compareAtPrice) * 100) : 0;
    const slug = await buildUniqueSlug(body.name);
    const stock = Number(body.stock || 0);
    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || "",
        category: body.category.trim(),
        price: Number(body.price),
        compareAtPrice,
        discountPct,
        stock,
        sizes: body.sizes?.filter(Boolean) || [],
        colors: body.colors?.filter(Boolean) || [],
        tags: body.tags?.filter(Boolean) || [],
        images: body.images.filter(Boolean),
        isFestivalSale: Boolean(body.isFestivalSale),
        isYearRoundSale: Boolean(body.isYearRoundSale),
        isActive: false,
        status: "DRAFT",
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
          title: "Product awaiting approval",
          message: `${vendor.shopName} submitted ${product.name} for review.`,
          type: "PRODUCT",
          link: "/admin#products",
        })),
      }).catch(() => undefined);
    }

    if (hasConfiguredMailTransport()) {
      await sendMail({
        to: admins.map((admin) => admin.email),
        from: process.env.VENDOR_SUPPORT_EMAIL_FROM || "vendorSupport@fitbazar.com",
        subject: `Product awaiting approval: ${product.name}`,
        text: `${vendor.shopName} submitted ${product.name} for review.`,
        html: renderVendorUpdateEmail(
          "Admin",
          "Product awaiting approval",
          `${vendor.shopName} submitted ${product.name} for review.`,
          buildAbsoluteAppUrl("/admin#products"),
        ),
      }).catch(() => undefined);
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
