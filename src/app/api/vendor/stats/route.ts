import { NextResponse } from "next/server";
import { expireExpiredPartnerships } from "@/lib/partner-program";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireVendorSession({ allowPending: true });
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    await expireExpiredPartnerships();

    const { vendor } = auth;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [fullVendor, ordersToday, pendingOrders, todayRevenue, allReviews, recentOrders, recentVendorReviews] = await Promise.all([
      prisma.vendor.findUnique({
        where: { id: vendor.id },
        select: {
          id: true,
          shopName: true,
          slug: true,
          isApproved: true,
          isSuspended: true,
          isPartnered: true,
          partnerStatus: true,
          partnerPlan: true,
          partnerExpiresAt: true,
        },
      }),
      prisma.order.count({
        where: {
          vendorId: vendor.id,
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.order.count({
        where: {
          vendorId: vendor.id,
          status: { in: ["PENDING", "RECEIVED", "PACKED"] },
        },
      }),
      prisma.order.aggregate({
        where: {
          vendorId: vendor.id,
          createdAt: { gte: startOfDay },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.review.findMany({
        where: {
          product: {
            vendorId: vendor.id,
          },
        },
        select: {
          rating: true,
        },
      }),
      prisma.order.findMany({
        where: { vendorId: vendor.id },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.vendorReview.findMany({
        where: { vendorId: vendor.id, isVisible: true },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const avgRating = allReviews.length
      ? Number((allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length).toFixed(1))
      : 0;

    return NextResponse.json({
      vendor: fullVendor || vendor,
      stats: {
        todaysRevenue: todayRevenue._sum.totalAmount || 0,
        ordersToday,
        pendingOrders,
        avgRating,
      },
      recentOrders,
      recentReviews: recentVendorReviews,
    });
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    return NextResponse.json({ error: "Failed to fetch vendor stats" }, { status: 500 });
  }
}
