export type PublicVendorIdentityInput = {
  shopName?: string | null;
  slug?: string | null;
  isPartnered?: boolean | null;
};

export const PRIVATE_VENDOR_DISPLAY_NAME = "Fit Bazar Curated Seller";

export function canShowPublicVendorIdentity(vendor?: PublicVendorIdentityInput | null) {
  return Boolean(vendor?.isPartnered);
}

export function getPublicVendorName(vendor?: PublicVendorIdentityInput | null) {
  return canShowPublicVendorIdentity(vendor) && vendor?.shopName ? vendor.shopName : PRIVATE_VENDOR_DISPLAY_NAME;
}

export function getPublicVendorSlug(vendor?: PublicVendorIdentityInput | null) {
  return canShowPublicVendorIdentity(vendor) ? vendor?.slug || undefined : undefined;
}
