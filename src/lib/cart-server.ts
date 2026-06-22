import { prisma } from "@/lib/prisma";
import { getSafeImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/media";
import { isPublicProductStatus } from "@/lib/product-status";
import { getPublicVendorName, getPublicVendorSlug } from "@/lib/public-vendor-identity";

export function serializeCartItem(item: {
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
    vendor: { shopName: string; slug: string; isPartnered?: boolean | null };
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
      FALLBACK_PRODUCT_IMAGE,
    ),
    vendorId: item.product.vendorId,
    vendorName: getPublicVendorName(item.product.vendor),
    vendorSlug: getPublicVendorSlug(item.product.vendor),
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
          isPartnered: true,
          isApproved: true,
          isSuspended: true,
        },
      },
    },
  });

  return new Map(products.map((product) => [product.id, product]));
}

export async function getCustomerCartItems(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
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

  return validItems;
}

export async function addCustomerCartItem(
  userId: string,
  body: {
    productId?: string;
    quantity?: number;
    size?: string;
    color?: string;
  },
) {
  if (!body.productId) {
    return { error: "productId is required", status: 400 as const };
  }

  const quantity = Number(body.quantity || 1);
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { error: "Quantity must be at least 1", status: 400 as const };
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
    return { error: "Product is not available", status: 404 as const };
  }

  const existing = await prisma.cartItem.findFirst({
    where: {
      userId,
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
    return { error: "Requested quantity exceeds stock", status: 400 as const };
  }

  const item = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      })
    : await prisma.cartItem.create({
        data: {
          userId,
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
          isPartnered: true,
        },
      },
    },
  });

  if (!productDetails) {
    return { error: "Product is not available", status: 404 as const };
  }

  return {
    item: serializeCartItem({
      ...item,
      product: productDetails,
    }),
    status: existing ? 200 as const : 201 as const,
  };
}

export async function clearCustomerCart(userId: string) {
  await prisma.cartItem.deleteMany({
    where: { userId },
  });
}

export async function updateCustomerCartItem(userId: string, itemId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return { error: "Quantity must be between 1 and 99", status: 400 as const };
  }

  const existing = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
    include: {
      product: {
        include: {
          vendor: {
            select: { shopName: true, slug: true, isPartnered: true, isApproved: true, isSuspended: true },
          },
        },
      },
    },
  });

  if (!existing) return { error: "Cart item not found", status: 404 as const };
  if (!isPublicProductStatus(existing.product.status) || !existing.product.vendor.isApproved || existing.product.vendor.isSuspended) {
    return { error: "Product is not available", status: 400 as const };
  }
  if (existing.product.stock > 0 && quantity > existing.product.stock) {
    return { error: "Requested quantity exceeds stock", status: 400 as const };
  }

  const item = await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return { item: serializeCartItem({ ...item, product: existing.product }), status: 200 as const };
}

export async function removeCustomerCartItem(userId: string, itemId: string) {
  const result = await prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
  if (!result.count) return { error: "Cart item not found", status: 404 as const };
  return { success: true as const, status: 200 as const };
}
