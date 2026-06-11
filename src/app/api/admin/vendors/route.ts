import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPaginationMeta, getAdminPagination, getAdminSearch } from "@/lib/admin-pagination";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = getAdminSearch(searchParams);
    const { page, pageSize, skip, take } = getAdminPagination(searchParams);
    const where = q
      ? {
          OR: [
            { shopName: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { panNumber: { contains: q, mode: "insensitive" as const } },
            { district: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
            { user: { phone: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : undefined;

    const [vendors, total, topShops] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where: {
          isPartnered: true,
          isTopShop: true,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

    return NextResponse.json({
      vendors,
      topShops,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("Error fetching admin vendors:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
