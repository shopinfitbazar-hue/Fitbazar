import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileVendor } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

async function requireAvailableMobileVendor(request: Request) {
  const auth = await requireMobileVendor(request);

  const vendor = await prisma.vendor.findUnique({
    where: { id: auth.user.vendorId },
    select: {
      id: true,
      shopName: true,
      slug: true,
      isApproved: true,
      isSuspended: true,
      isPartnered: true,
      partnerStatus: true,
      partnerPlan: true,
    },
  });

  if (!vendor || vendor.isSuspended) {
    throw new MobileAuthError("Vendor account is not available.", 403);
  }

  return { auth, vendor };
}

export async function GET(request: Request) {
  try {
    const { vendor } = await requireAvailableMobileVendor(request);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ordersToday, pendingOrders, todayRevenue, products, lowStockProducts, reviews, recentOrders] =
      await Promise.all([
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
        prisma.product.count({
          where: {
            vendorId: vendor.id,
          },
        }),
        prisma.product.count({
          where: {
            vendorId: vendor.id,
            stock: { lte: 5 },
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
                id: true,
                name: true,
                email: true,
                phone: true,
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
          take: 5,
        }),
      ]);

    const avgRating = reviews.length
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : 0;

    return NextResponse.json({
      vendor,
      stats: {
        todaysRevenue: todayRevenue._sum.totalAmount || 0,
        ordersToday,
        pendingOrders,
        products,
        lowStockProducts,
        avgRating,
      },
      recentOrders,
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching mobile vendor dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch vendor dashboard." }, { status: 500 });
  }
}
