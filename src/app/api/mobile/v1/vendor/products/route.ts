import { NextResponse } from "next/server";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { requireMobileVendor } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

async function requireApprovedMobileVendor(request: Request) {
  const auth = await requireMobileVendor(request);

  const vendor = await prisma.vendor.findUnique({
    where: { id: auth.user.vendorId },
    select: {
      id: true,
      shopName: true,
      slug: true,
      isApproved: true,
      isSuspended: true,
    },
  });

  if (!vendor || vendor.isSuspended) {
    throw new MobileAuthError("Vendor account is not available.", 403);
  }

  if (!vendor.isApproved) {
    throw new MobileAuthError("Vendor pending approval.", 403);
  }

  return { auth, vendor };
}

async function buildUniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

export async function GET(request: Request) {
  try {
    const { vendor } = await requireApprovedMobileVendor(request);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().slice(0, 120);
    const { page, pageSize, skip, take } = getPagination(searchParams, {
      defaultPageSize: 25,
      maxPageSize: 100,
    });
    const where = {
      vendorId: vendor.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { category: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      vendor,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching mobile vendor products:", error);
    return NextResponse.json({ error: "Failed to fetch vendor products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { vendor } = await requireApprovedMobileVendor(request);
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
    };

    if (!body.name || !body.category || body.price === undefined) {
      return NextResponse.json({ error: "Missing required product fields" }, { status: 400 });
    }

    if (!body.description?.trim()) {
      return NextResponse.json({ error: "A vendor-written product description is required." }, { status: 400 });
    }

    if (!body.images?.filter(Boolean).length) {
      return NextResponse.json({ error: "At least one product image is required." }, { status: 400 });
    }

    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Product price must be greater than zero." }, { status: 400 });
    }

    const compareAtPrice = body.compareAtPrice && body.compareAtPrice > price ? body.compareAtPrice : null;
    const discountPct = compareAtPrice ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: body.name.trim(),
        slug: await buildUniqueSlug(body.name),
        description: body.description.trim(),
        category: body.category.trim(),
        price,
        compareAtPrice,
        discountPct,
        stock: Number(body.stock || 0),
        sizes: body.sizes?.filter(Boolean) || [],
        colors: body.colors?.filter(Boolean) || [],
        tags: body.tags?.filter(Boolean) || [],
        images: body.images.filter(Boolean),
        isActive: false,
        status: "DRAFT",
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Product awaiting approval",
          message: `${vendor.shopName} submitted ${product.name} from the vendor app.`,
          type: "PRODUCT",
          link: "/admin#products",
        })),
      }).catch(() => undefined);
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error creating mobile vendor product:", error);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
