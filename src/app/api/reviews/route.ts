import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const MAX_COMMENT_LENGTH = 1200;

function normalizeRating(value: unknown) {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return null;
  }
  return Math.round(rating);
}

function normalizeComment(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_COMMENT_LENGTH);
}

async function hasDeliveredProductOrder(userId: string, productId: string) {
  const order = await prisma.order.findFirst({
    where: {
      customerId: userId,
      status: "DELIVERED",
      items: {
        some: {
          productId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(order);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const slug = searchParams.get("slug");

    if (!productId && !slug) {
      return NextResponse.json({ error: "productId or slug is required" }, { status: 400 });
    }

    const product =
      slug && !productId
        ? await prisma.product.findUnique({
            where: { slug },
            select: { id: true },
          })
        : null;

    const resolvedProductId = productId || product?.id;

    if (!resolvedProductId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [reviews, aggregate, existingReview, hasDeliveredOrder] = await Promise.all([
      prisma.review.findMany({
        where: { productId: resolvedProductId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.review.aggregate({
        where: { productId: resolvedProductId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      session?.user?.id
        ? prisma.review.findFirst({
            where: {
              productId: resolvedProductId,
              userId: session.user.id,
            },
            select: {
              id: true,
              rating: true,
              comment: true,
              images: true,
            },
          })
        : Promise.resolve(null),
      session?.user?.id ? hasDeliveredProductOrder(session.user.id, resolvedProductId) : Promise.resolve(false),
    ]);

    return NextResponse.json({
      reviews,
      existingReview,
      canReview: Boolean(session?.user?.id && (hasDeliveredOrder || existingReview)),
      hasDeliveredOrder,
      summary: {
        averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0,
        reviewCount: aggregate._count._all,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, comment, images } = body;
    const normalizedRating = normalizeRating(rating);

    if (typeof productId !== "string" || !productId.trim() || !normalizedRating) {
      return NextResponse.json(
        { error: "Product and a rating from 1 to 5 are required." },
        { status: 400 }
      );
    }

    const [product, eligibleOrder] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      }),
      hasDeliveredProductOrder(session.user.id, productId),
    ]);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!eligibleOrder) {
      return NextResponse.json({ error: "Only customers with delivered orders can review this product." }, { status: 403 });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating: normalizedRating,
        comment: normalizeComment(comment),
        images: Array.isArray(images) ? images : [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ review, message: "Review created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, rating, comment, images } = body;
    const normalizedRating = rating === undefined ? undefined : normalizeRating(rating);

    if (typeof reviewId !== "string" || !reviewId.trim()) {
      return NextResponse.json(
        { error: "Review ID required" },
        { status: 400 }
      );
    }

    if (rating !== undefined && !normalizedRating) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: session.user.id,
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: normalizedRating ?? existingReview.rating,
        comment: comment === undefined ? existingReview.comment : normalizeComment(comment),
        images: Array.isArray(images) ? images : existingReview.images,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ review, message: "Review updated successfully" });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID required" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
