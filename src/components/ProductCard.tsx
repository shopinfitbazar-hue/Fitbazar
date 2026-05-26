"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, Star } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import { useToast } from "@/lib/ToastContext";
import { useLanguage } from "@/lib/LanguageContext";
import { getSafeImageUrl, getShowcaseImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/media";
import SmartImage from "@/components/ui/SmartImage";

export interface ProductCardProps {
  id: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  images: string[];
  vendorName: string;
  vendorSlug?: string;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  sizes?: string[];
  isFestival?: boolean;
  isSale?: boolean;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatCompactCount(value?: number) {
  if (!value) return null;
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return String(value);
}

function ProductCard({
  id,
  slug,
  name,
  price,
  originalPrice,
  discountPercent,
  images,
  vendorName,
  vendorSlug,
  rating,
  soldCount,
  sizes,
  isFestival,
  isSale,
}: ProductCardProps) {
  const { t } = useLanguage();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { addToast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const [animateHeart, setAnimateHeart] = useState(false);
  const href = `/products/${slug || id}`;
  const image = getShowcaseImageUrl(getSafeImageUrl(images[0], FALLBACK_PRODUCT_IMAGE));
  const vendorPath = `/shop/${vendorSlug || slugify(vendorName)}`;
  const wishlisted = isInWishlist(id);
  const canShop = !session?.user || session.user.role === "CUSTOMER";

  const badges = useMemo(() => {
    const items: Array<{ label: string; className: string }> = [];
    if (isFestival) items.push({ label: "Festival", className: "badge badge-pink" });
    if (isSale) items.push({ label: "Sale", className: "badge badge-orange" });
    if (discountPercent && discountPercent > 0) {
      items.push({ label: `${discountPercent}% OFF`, className: "badge badge-amber" });
    }
    return items;
  }, [discountPercent, isFestival, isSale]);
  const ratingText = typeof rating === "number" ? rating.toFixed(1) : null;
  const soldText = formatCompactCount(soldCount);

  const toggleWishlist = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnimateHeart(true);
    window.setTimeout(() => setAnimateHeart(false), 220);

    if (wishlisted) {
      removeItem(id);
      addToast(t("removed_from_wishlist"), "info");
      return;
    }

    addItem({
      productId: id,
      slug,
      name,
      price,
      originalPrice,
      image,
      vendorName,
      vendorSlug,
    });
    addToast(t("added_to_wishlist"), "success");
  };

  return (
    <Link
      href={href}
      className="product-card group block overflow-hidden rounded-[24px] border border-white/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-lg)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--bg-surface)]">
        <SmartImage
          src={image}
          alt={name}
          fill
          sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 18vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />

        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(17,24,39,0.14),transparent)]" />

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {badges.map((badge) => (
            <span key={badge.label} className={badge.className}>
              {badge.label}
            </span>
          ))}
        </div>

        {ratingText || soldText ? (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.94)] px-2.5 py-1 shadow-[var(--shadow-sm)] backdrop-blur-sm">
            {ratingText ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-text-primary">
                <Star className="h-3.5 w-3.5 fill-[#FFC94A] text-[#FFC94A]" />
                {ratingText}
              </span>
            ) : null}
            {ratingText && soldText ? <span className="text-[11px] text-text-muted">|</span> : null}
            {soldText ? <span className="text-[11px] font-medium text-text-secondary">{soldText} {t("sold")}</span> : null}
          </div>
        ) : null}

        {canShop ? (
          <button
            type="button"
            onClick={toggleWishlist}
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.92)] shadow-[var(--shadow-sm)] backdrop-blur-md ${animateHeart ? "wishlist-pop" : ""}`}
            aria-label={t("toggle_wishlist")}
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-fb-pink text-fb-pink" : "text-text-muted"}`} />
          </button>
        ) : null}

        <div className="absolute inset-x-4 bottom-4 hidden translate-y-5 items-center justify-center rounded-full bg-[rgba(24,24,27,0.84)] px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:flex h-10 backdrop-blur-md">
          {t("view_details")}
        </div>
      </div>

      <div className="px-3 pb-4 pt-3">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            router.push(vendorPath);
          }}
          className="block truncate text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted"
        >
          {vendorName}
        </button>
        <h3 className="mt-2 line-clamp-2 text-[15px] font-medium leading-[1.35] tracking-[-0.02em] text-text-primary">{name}</h3>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[16px] font-semibold tracking-[-0.03em] text-text-primary">{formatPrice(price)}</span>
          {originalPrice && originalPrice > price ? (
            <>
              <span className="text-[12px] text-text-muted line-through">{formatPrice(originalPrice)}</span>
              <span className="rounded-full bg-[rgba(196,78,30,0.08)] px-2 py-1 text-[11px] font-semibold text-fb-orange">{discountPercent || 0}% OFF</span>
            </>
          ) : null}
        </div>

        {sizes?.length ? (
          <div className="mt-3 truncate text-[12px] text-text-muted">{sizes.slice(0, 4).join("  ")}</div>
        ) : null}
      </div>
    </Link>
  );
}

export default memo(ProductCard);
