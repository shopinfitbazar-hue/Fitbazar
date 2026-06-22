import { NextResponse } from "next/server";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { revalidateStorefrontCache } from "@/lib/storefront-cache";

export async function POST(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const body = await request.json().catch(() => ({}));
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const rating = Math.round(Number(body.rating));
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1200) : "";
    if (!productId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Product and rating from 1 to 5 are required." }, { status: 400 });
    }

    const deliveredOrder = await prisma.order.findFirst({
      where: { customerId: auth.user.id, status: "DELIVERED", items: { some: { productId } } },
      select: { id: true },
    });
    if (!deliveredOrder) return NextResponse.json({ error: "Only delivered purchases can be reviewed." }, { status: 403 });

    const existing = await prisma.review.findFirst({ where: { userId: auth.user.id, productId }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "You already reviewed this product." }, { status: 409 });

    const review = await prisma.review.create({
      data: { userId: auth.user.id, productId, rating, comment, images: [] },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    revalidateStorefrontCache();
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to submit review." }, { status: 500 });
  }
}
