import type { Product, Review, Vendor } from "@prisma/client";
import type { ProductCardProps } from "@/components/ProductCard";

type ProductWithVendor = Product & {
  vendor: Pick<Vendor, "id" | "shopName" | "slug" | "logo">;
  reviews?: Array<Pick<Review, "rating">>;
  _count?: {
    reviews?: number;
  };
};

type VendorWithCounts = Vendor & {
  reviews?: Array<{
    rating: number;
    isVisible?: boolean;
  }>;
  _count?: {
    products?: number;
    orders?: number;
    reviews?: number;
  };
};

export function formatPriceNpr(price: number) {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function mapProductToCard(product: ProductWithVendor): ProductCardProps {
  const reviewRatings = product.reviews?.map((review) => review.rating) ?? [];
  const rating = reviewRatings.length
    ? Number((reviewRatings.reduce((sum, value) => sum + value, 0) / reviewRatings.length).toFixed(1))
    : undefined;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    originalPrice: product.compareAtPrice ?? undefined,
    discountPercent: product.discountPct || undefined,
    images: product.images,
    vendorName: product.vendor.shopName,
    vendorSlug: product.vendor.slug,
    rating,
    reviewCount: product._count?.reviews ?? product.reviews?.length,
    soldCount: product.totalSold,
    sizes: product.sizes,
    isFestival: product.isFestivalSale,
    isSale: product.isYearRoundSale || product.discountPct > 0,
  };
}

export function mapVendorToCard(vendor: VendorWithCounts) {
  const visibleReviews = (vendor.reviews ?? []).filter((review) => review.isVisible !== false);
  const averageRating = visibleReviews.length
    ? Number((visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length).toFixed(1))
    : 0;

  return {
    id: vendor.id,
    slug: vendor.slug,
    shopName: vendor.shopName,
    logo: vendor.logo ?? undefined,
    description: vendor.description ?? undefined,
    rating: averageRating,
    reviewCount: vendor._count?.reviews ?? visibleReviews.length,
    productCount: vendor._count?.products ?? 0,
    location: vendor.category ?? "Nepal Fashion Store",
  };
}
