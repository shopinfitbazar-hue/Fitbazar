"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, ShoppingBag, Star, Zap } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
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
  colors?: string[];
  isFestival?: boolean;
  isSale?: boolean;
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
  colors,
  isFestival,
  isSale,
}: ProductCardProps) {
  const { t } = useLanguage();
  const { addItem: addWishlistItem, removeItem, isInWishlist } = useWishlist();
  const { addItem: addCartItem } = useCart();
  const { addToast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const [animateHeart, setAnimateHeart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const href = `/products/${slug || id}`;
  const image = getShowcaseImageUrl(getSafeImageUrl(images[0], FALLBACK_PRODUCT_IMAGE));
  const vendorPath = vendorSlug ? `/shop/${vendorSlug}` : null;
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

    addWishlistItem({
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

  const addProductToCart = () => {
    if (!canShop) {
      addToast(t("vendor_account_shopping_blocked"), "error");
      return false;
    }

    addCartItem({
      productId: id,
      slug,
      name,
      price,
      originalPrice,
      image,
      vendorName,
      vendorSlug,
      quantity: 1,
      size: sizes?.[0],
      color: colors?.[0],
    });

    setAddedToCart(true);
    window.setTimeout(() => setAddedToCart(false), 1500);
    addToast(t("added_to_bag"), "success");
    return true;
  };

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addProductToCart();
  };

  const handleBuyNow = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (addProductToCart()) {
      router.push("/checkout");
    }
  };

  return (
    <Link
      href={href}
      className="product-card group flex h-full min-w-0 snap-start flex-col overflow-hidden rounded-[20px] border border-white/80 bg-card shadow-[0_12px_34px_rgba(76,53,37,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(76,53,37,0.11)]"
    >
      <div className="relative aspect-[4/5] shrink-0 overflow-hidden bg-[var(--bg-surface)]">
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

        <div className="absolute inset-x-4 bottom-4 hidden h-10 translate-y-5 items-center justify-center rounded-full bg-[rgba(32,26,23,0.76)] px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:flex">
          {t("view_details")}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-4 pt-3">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (vendorPath) router.push(vendorPath);
          }}
          className={`block truncate text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted ${vendorPath ? "" : "cursor-default"}`}
          aria-label={vendorPath ? `Open ${vendorName}` : vendorName}
        >
          {vendorName}
        </button>
        <h3 className="mt-2 min-h-[41px] line-clamp-2 text-[15px] font-semibold leading-[1.35] text-text-primary">{name}</h3>

        <div className="mt-3 flex min-h-[44px] flex-wrap items-start gap-2">
          <span className="text-[17px] font-bold leading-none text-[var(--text-price)]">{formatPrice(price)}</span>
          {originalPrice && originalPrice > price ? (
            <>
              <span className="text-[12px] text-text-muted line-through">{formatPrice(originalPrice)}</span>
              <span className="rounded-full bg-fb-pink-bg px-2 py-1 text-[11px] font-semibold text-fb-pink">{discountPercent || 0}% OFF</span>
            </>
          ) : null}
        </div>

        <div className="mt-3 min-h-[18px] truncate text-[12px] text-text-muted">
          {sizes?.length ? sizes.slice(0, 4).join("  ") : ""}
        </div>

        {canShop ? (
          <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3 sm:gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border border-fb-pink/30 bg-white px-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-fb-pink hover:bg-fb-pink-bg sm:px-3 sm:text-[11px]"
              aria-label={t("add_to_cart")}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="truncate">{addedToCart ? t("added_check") : t("cart")}</span>
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full bg-fb-pink px-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-white shadow-[0_10px_24px_rgba(196,63,87,0.22)] hover:bg-[#b7354d] sm:px-3 sm:text-[11px]"
              aria-label={t("buy_now")}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="truncate">{t("buy_now")}</span>
            </button>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default memo(ProductCard);
