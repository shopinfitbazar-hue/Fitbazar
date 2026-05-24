import type { Prisma } from "@prisma/client";
import { ProductStatus } from "@prisma/client";

export const publicVendorVisibilityFilter: Prisma.VendorWhereInput = {
  isApproved: true,
  isSuspended: false,
};

export const publicProductVendorFilter: Prisma.VendorWhereInput = {
  isApproved: true,
  isSuspended: false,
};

export const publicProductVisibilityFilter: Prisma.ProductWhereInput = {
  status: ProductStatus.ACTIVE,
  isActive: true,
  vendor: publicProductVendorFilter,
};
