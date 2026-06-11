import { OrderStatus } from "@prisma/client";
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
    const statusQuery = q.toUpperCase();
    const statusFilters = Object.values(OrderStatus).includes(statusQuery as OrderStatus)
      ? [{ status: { equals: statusQuery as OrderStatus } }]
      : [];
    const where = q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" as const } },
            ...statusFilters,
            { paymentMethod: { contains: q, mode: "insensitive" as const } },
            { paymentStatus: { contains: q, mode: "insensitive" as const } },
            { vendor: { shopName: { contains: q, mode: "insensitive" as const } } },
            { customer: { name: { contains: q, mode: "insensitive" as const } } },
            { customer: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : undefined;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          vendor: {
            select: {
              shopName: true,
            },
          },
          customer: {
            select: {
              name: true,
              email: true,
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
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
