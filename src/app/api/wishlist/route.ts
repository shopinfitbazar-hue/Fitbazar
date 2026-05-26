import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

export async function GET() {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: auth.session.user.id },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                id: true,
                shopName: true,
                slug: true,
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCustomerSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const body = (await request.json()) as { productId?: string };
    if (!body.productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const item = await prisma.wishlist.upsert({
      where: {
          userId_productId: {
          userId: auth.session.user.id,
          productId: body.productId,
        },
      },
      update: {},
      create: {
        userId: auth.session.user.id,
        productId: body.productId,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error adding wishlist item:", error);
    return NextResponse.json({ error: "Failed to add wishlist item" }, { status: 500 });
  }
}
