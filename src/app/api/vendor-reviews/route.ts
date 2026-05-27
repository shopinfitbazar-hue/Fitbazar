import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { requireCustomerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

async function resolveVendor(vendorId?: string | null, slug?: string | null) {
  if (vendorId) {
    return prisma.vendor.findFirst({
      where: { id: vendorId, isApproved: true, isSuspended: false },
      select: { id: true, shopName: true, slug: true },
    });
  }

  if (slug) {
    return prisma.vendor.findFirst({
      where: { slug, isApproved: true, isSuspended: false },
      select: { id: true, shopName: true, slug: true },
    });
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendor = await resolveVendor(searchParams.get("vendorId"), searchParams.get("slug"));

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const [reviews, aggregate, existingReview, eligibleOrder] = await Promise.all([
      prisma.vendorReview.findMany({
        where: { vendorId: vendor.id, isVisible: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendorReview.aggregate({
        where: { vendorId: vendor.id, isVisible: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      userId
        ? prisma.vendorReview.findUnique({
            where: {
              userId_vendorId: {
                userId,
                vendorId: vendor.id,
              },
            },
          })
        : null,
      userId
        ? prisma.order.findFirst({
            where: {
              customerId: userId,
              vendorId: vendor.id,
              status: "DELIVERED",
            },
            select: { id: true, orderNumber: true },
            orderBy: { createdAt: "desc" },
          })
        : null,
    ]);

    return NextResponse.json({
      vendor,
      reviews,
      summary: {
        averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0,
        reviewCount: aggregate._count._all,
      },
      canReview: Boolean(userId && eligibleOrder && !existingReview),
      existingReview,
      eligibleOrder,
    });
  } catch (error) {
    console.error("Error fetching vendor reviews:", error);
    return NextResponse.json({ error: "Failed to fetch vendor reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const body = (await request.json()) as {
      vendorId?: string;
      rating?: number;
      comment?: string;
    };

    if (!body.vendorId || !body.rating) {
      return NextResponse.json({ error: "Vendor and rating are required." }, { status: 400 });
    }

    if (!Number.isFinite(body.rating) || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const vendor = await prisma.vendor.findFirst({
      where: { id: body.vendorId, isApproved: true, isSuspended: false },
      select: { id: true, userId: true, shopName: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    const deliveredOrder = await prisma.order.findFirst({
      where: {
        customerId: auth.session.user.id,
        vendorId: vendor.id,
        status: "DELIVERED",
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (!deliveredOrder) {
      return NextResponse.json({ error: "Only customers with delivered orders can review this shop." }, { status: 403 });
    }

    const existingReview = await prisma.vendorReview.findUnique({
      where: {
        userId_vendorId: {
          userId: auth.session.user.id,
          vendorId: vendor.id,
        },
      },
      select: { id: true },
    });

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this vendor." }, { status: 400 });
    }

    const review = await prisma.vendorReview.create({
      data: {
        userId: auth.session.user.id,
        vendorId: vendor.id,
        orderId: deliveredOrder.id,
        rating: Math.round(body.rating),
        comment: body.comment?.trim() || "",
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: vendor.userId,
        title: "New store review",
        message: `${auth.session.user.name || "A customer"} rated ${vendor.shopName} ${review.rating}/5.`,
        type: "VENDOR_REVIEW",
        link: `/vendor/dashboard`,
      },
    }).catch(() => undefined);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor review:", error);
    return NextResponse.json({ error: "Failed to create vendor review" }, { status: 500 });
  }
}
