import { OrderStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireVendorSession({ allowPending: true });
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor } = auth;
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams, {
      defaultPageSize: 25,
      maxPageSize: 100,
    });
    const payoutStatuses: OrderStatus[] = [OrderStatus.PACKED, OrderStatus.HANDED_TO_DELIVERY, OrderStatus.DELIVERED];
    const payoutWhere: Prisma.OrderWhereInput = {
      vendorId: vendor.id,
      status: {
        in: payoutStatuses,
      },
    };

    const [orders, total, totalPayout, releasedPayout, pendingPayout] = await Promise.all([
      prisma.order.findMany({
        where: payoutWhere,
        select: {
          id: true,
          orderNumber: true,
          vendorPayout: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.order.count({ where: payoutWhere }),
      prisma.order.aggregate({
        where: payoutWhere,
        _sum: {
          vendorPayout: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          vendorId: vendor.id,
          status: OrderStatus.DELIVERED,
        },
        _sum: {
          vendorPayout: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          vendorId: vendor.id,
          status: {
            in: [OrderStatus.PACKED, OrderStatus.HANDED_TO_DELIVERY],
          },
        },
        _sum: {
          vendorPayout: true,
        },
      }),
    ]);

    return NextResponse.json({
      vendor,
      totals: {
        totalPayout: totalPayout._sum?.vendorPayout || 0,
        released: releasedPayout._sum?.vendorPayout || 0,
        pending: pendingPayout._sum?.vendorPayout || 0,
      },
      payouts: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        amount: order.vendorPayout,
        grossAmount: order.totalAmount,
        status: order.status === "DELIVERED" ? "RELEASED" : "PENDING",
        createdAt: order.createdAt,
      })),
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("Error fetching vendor payouts:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}
