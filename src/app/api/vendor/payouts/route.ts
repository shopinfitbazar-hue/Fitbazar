import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireVendorSession({ allowPending: true });
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor } = auth;
    const orders = await prisma.order.findMany({
      where: {
        vendorId: vendor.id,
        status: {
          in: ["PACKED", "HANDED_TO_DELIVERY", "DELIVERED"],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        vendorPayout: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totals = orders.reduce(
      (summary, order) => {
        summary.totalPayout += order.vendorPayout;
        if (order.status === "DELIVERED") {
          summary.released += order.vendorPayout;
        } else {
          summary.pending += order.vendorPayout;
        }
        return summary;
      },
      { totalPayout: 0, released: 0, pending: 0 },
    );

    return NextResponse.json({
      vendor,
      totals,
      payouts: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        amount: order.vendorPayout,
        grossAmount: order.totalAmount,
        status: order.status === "DELIVERED" ? "RELEASED" : "PENDING",
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching vendor payouts:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}
