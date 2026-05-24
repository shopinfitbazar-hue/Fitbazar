export type VendorAccessInput = {
  isApproved: boolean;
  isSuspended: boolean;
};

export function getVendorAccessState(vendor: VendorAccessInput) {
  if (vendor.isSuspended) {
    return {
      canOperate: false,
      reason: "Vendor suspended" as const,
    };
  }

  if (!vendor.isApproved) {
    return {
      canOperate: false,
      reason: "Vendor pending approval" as const,
    };
  }

  return {
    canOperate: true,
    reason: null,
  };
}
