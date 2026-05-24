import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/server-auth";
import { getSafeImageUrl } from "@/lib/media";
import { isPublicProductStatus } from "@/lib/product-status";

export const dynamic = "force-dynamic";

function serializeCartItem(item: {
  id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    images: string[];
    vendorId: string;
    vendor: { shopName: string; slug: string };
  };
}) {
  return {
    id: item.id,
    productId: item.product.id,
    slug: item.product.slug,
    name: item.product.name,
    price: item.product.price,
    originalPrice: item.product.compareAtPrice ?? undefined,
    image: getSafeImageUrl(
      item.product.images[0],
      "https://picsum.photos/seed/fitbazar-product-fallback/900/1200",
    ),
    vendorId: item.product.vendorId,
    vendorName: item.product.vendor.shopName,
    vendorSlug: item.product.vendor.slug,
    quantity: item.quantity,
    size: item.size || undefined,
    color: item.color || undefined,
  };
}

async function fetchProductsForCart(productIds: string[]) {
  if (!productIds.length) {
    return new Map<string, null>();
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      vendor: {
        select: {
          shopName: true,
          slug: true,
          isApproved: true,
          isSuspended: true,
        },
      },
    },
  });

  return new Map(products.map((product) => [product.id, product]));
}

export async function GET() {
  try {
    const auth = await requireUserSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: auth.session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const productsById = await fetchProductsForCart(items.map((item) => item.productId));

    const validItems = items
      .map((item) => {
        const product = productsById.get(item.productId);
        if (!product || !isPublicProductStatus(product.status) || !product.vendor.isApproved || product.vendor.isSuspended) {
          return null;
        }

        return serializeCartItem({
          ...item,
          product,
        });
      })
      .filter((item): item is ReturnType<typeof serializeCartItem> => item !== null);

    const validIdSet = new Set(validItems.map((item) => item.id));
    const staleIds = items.filter((item) => !validIdSet.has(item.id)).map((item) => item.id);
    if (staleIds.length) {
      await prisma.cartItem.deleteMany({ where: { id: { in: staleIds } } }).catch(() => undefined);
    }

    return NextResponse.json({ items: validItems });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = (await request.json()) as {
      productId?: string;
      quantity?: number;
      size?: string;
      color?: string;
    };

    if (!body.productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const quantity = Number(body.quantity || 1);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: body.productId,
        status: "ACTIVE",
        vendor: {
          isApproved: true,
          isSuspended: false,
        },
      },
      select: {
        id: true,
        stock: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product is not available" }, { status: 404 });
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        userId: auth.session.user.id,
        productId: body.productId,
        size: body.size || null,
        color: body.color || null,
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (product.stock > 0 && nextQuantity > product.stock) {
      return NextResponse.json({ error: "Requested quantity exceeds stock" }, { status: 400 });
    }

    const item = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: nextQuantity },
        })
      : await prisma.cartItem.create({
          data: {
            userId: auth.session.user.id,
            productId: body.productId,
            quantity,
            size: body.size?.trim() || null,
            color: body.color?.trim() || null,
          },
        });

    const productDetails = await prisma.product.findUnique({
      where: { id: body.productId },
      include: {
        vendor: {
          select: {
            shopName: true,
            slug: true,
          },
        },
      },
    });

    if (!productDetails) {
      return NextResponse.json({ error: "Product is not available" }, { status: 404 });
    }

    return NextResponse.json({
      item: serializeCartItem({
        ...item,
        product: productDetails,
      }),
    }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Error adding cart item:", error);
    return NextResponse.json({ error: "Failed to add cart item" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await requireUserSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: auth.session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}
