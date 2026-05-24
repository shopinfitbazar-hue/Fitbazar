import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const [orderAgg, vendorCount, orderCount, vendorRevenue] = await Promise.all([
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
          commissionAmt: true,
        },
      }),
      prisma.vendor.count(),
      prisma.order.count(),
      prisma.order.findMany({
        select: {
          createdAt: true,
          totalAmount: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalGmv: orderAgg._sum.totalAmount || 0,
        totalCommission: orderAgg._sum.commissionAmt || 0,
        vendors: vendorCount,
        orders: orderCount,
      },
      chartData: vendorRevenue.map((item) => ({
        date: item.createdAt,
        value: item.totalAmount,
      })),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
