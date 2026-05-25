import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function removeOrDiscontinueProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          orderItems: true,
          reviews: true,
          wishlist: true,
          cartItems: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const hasAttachedRecords =
    product._count.orderItems > 0 ||
    product._count.reviews > 0 ||
    product._count.wishlist > 0 ||
    product._count.cartItems > 0;

  if (hasAttachedRecords) {
    await prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.HIDDEN,
        isActive: false,
        isFeatured: false,
        isFestivalSale: false,
        isYearRoundSale: false,
        stock: 0,
      },
    });

    return {
      deleted: false,
      discontinued: true,
      message: "Product has order or customer history, so it was discontinued and removed from the storefront.",
    };
  }

  await prisma.product.delete({ where: { id } });

  return {
    deleted: true,
    discontinued: false,
    message: "Product deleted.",
  };
}
