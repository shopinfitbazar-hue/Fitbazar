import { ProductStatus } from "@prisma/client";

export const PUBLIC_PRODUCT_STATUSES: ProductStatus[] = [ProductStatus.ACTIVE];

export function normalizeProductStatus(value?: string | null): ProductStatus {
  switch ((value || "").toUpperCase()) {
    case ProductStatus.ACTIVE:
      return ProductStatus.ACTIVE;
    case ProductStatus.HIDDEN:
      return ProductStatus.HIDDEN;
    case ProductStatus.OUT_OF_STOCK:
      return ProductStatus.OUT_OF_STOCK;
    case ProductStatus.DRAFT:
    default:
      return ProductStatus.DRAFT;
  }
}

export function deriveProductStatus({
  requestedStatus,
  stock,
  isActive,
}: {
  requestedStatus?: string | null;
  stock: number;
  isActive?: boolean;
}): ProductStatus {
  if (requestedStatus) {
    const normalized = normalizeProductStatus(requestedStatus);
    if (normalized === ProductStatus.ACTIVE && stock <= 0) {
      return ProductStatus.OUT_OF_STOCK;
    }
    return normalized;
  }

  if (isActive === false) {
    return ProductStatus.HIDDEN;
  }

  if (stock <= 0) {
    return ProductStatus.OUT_OF_STOCK;
  }

  return ProductStatus.ACTIVE;
}

export function isPublicProductStatus(status: ProductStatus | string | null | undefined) {
  return status === ProductStatus.ACTIVE;
}

