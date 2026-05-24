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

    const [reviews, aggregate] = await Promise.all([
      prisma.vendorReview.findMany({
        where: { vendorId: vendor.id },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendorReview.aggregate({
        where: { vendorId: vendor.id, isVisible: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      reviews,
      summary: {
        averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0,
        reviewCount: aggregate._count._all,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor dashboard reviews:", error);
    return NextResponse.json({ error: "Failed to fetch vendor reviews" }, { status: 500 });
  }
}
