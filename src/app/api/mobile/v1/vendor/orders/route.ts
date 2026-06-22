import { NextResponse } from "next/server";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { requireMobileVendor } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";

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

export async function GET(request: Request) {
  try {
    const { vendor } = await requireApprovedMobileVendor(request);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().slice(0, 120);
    const status = searchParams.get("status");
    const { page, pageSize, skip, take } = getPagination(searchParams, {
      defaultPageSize: 25,
      maxPageSize: 100,
    });
    const where = {
      vendorId: vendor.id,
      ...(status && status !== "ALL" ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" as const } },
              { customer: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      vendor,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching mobile vendor orders:", error);
    return NextResponse.json({ error: "Failed to fetch vendor orders." }, { status: 500 });
  }
}
