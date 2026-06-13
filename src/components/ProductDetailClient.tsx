"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BadgeCheck,
  ChevronDown,
  Heart,
  Maximize2,
  Minus,
  PackageCheck,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
  Zap,
} from "lucide-react";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import ImageGallery from "@/components/ImageGallery";
import SmartImage from "@/components/ui/SmartImage";
import { formatPriceNpr } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useToast } from "@/lib/ToastContext";
import { getDeliveryMessage } from "@/lib/pincode";
import { useLanguage } from "@/lib/LanguageContext";
import { getSafeImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/media";

type ProductReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
};

type ExistingReview = {
  id: string;
  rating: number;
  comment?: string | null;
  images?: string[];
};

interface ProductDetailClientProps {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    discountPct: number;
    images: string[];
    sizes: string[];
    colors: string[];
    stock: number;
    totalSold: number;
    vendor: {
      id: string;
      shopName: string;
      slug: string;
      logo?: string | null;
      category?: string | null;
    };
    reviews: ProductReview[];
  };
  similarProducts: ProductCardProps[];
  alsoBoughtProducts: ProductCardProps[];
}

const colorSwatches: Record<string, string> = {
  black: "#050505",
  blue: "#1d4ed8",
  navy: "#0f2f68",
  crimson: "#b91c1c",
  maroon: "#7f1023",
  red: "#dc2626",
  ruby: "#b91c1c",
  wine: "#7f1d1d",
  rose: "#e11d48",
  pink: "#ec4899",
  ivory: "#fffaf0",
  cream: "#f5ead4",
  white: "#ffffff",
  beige: "#d6c3a1",
  sand: "#c2a878",
  stone: "#9ca3af",
  grey: "#6b7280",
  gray: "#6b7280",
  charcoal: "#36454f",
  brown: "#7c4a2d",
  forest: "#166534",
  green: "#15803d",
  emerald: "#047857",
  olive: "#6b7d2c",
  gold: "#d4a017",
  mustard: "#d79a1e",
  yellow: "#facc15",
  orange: "#f97316",
  teal: "#0f766e",
  berry: "#9f1239",
  indigo: "#3730a3",
  brick: "#9a3412",
  ochre: "#cc7722",
  peach: "#f4a88f",
  mauve: "#a78bfa",
  mocha: "#7b5141",
  rust: "#b45309",
  slate: "#475569",
};

function swatchColor(color: string) {
  return colorSwatches[color.trim().toLowerCase()] ?? "#d4d5d9";
}

export default function ProductDetailClient({
  product,
  similarProducts,
  alsoBoughtProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: session, status: authStatus } = useSession();
  const { addItem } = useCart();
  const { addItem: addWishlistItem, removeItem: removeWishlistItem, isInWishlist } = useWishlist();
  const { addToast } = useToast();
  const safeImages = useMemo(
    () =>
      (product.images.length ? product.images : [FALLBACK_PRODUCT_IMAGE]).map((image) =>
        getSafeImageUrl(image, FALLBACK_PRODUCT_IMAGE),
      ),
    [product.images],
  );
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState("");
  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState(t("enter_pincode_hint"));
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false);
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [mobileZoomOpen, setMobileZoomOpen] = useState(false);
  const [mobileZoomScale, setMobileZoomScale] = useState(1);
  const accountRole = session?.user?.role;
  const blocksShopping = accountRole === "VENDOR" || accountRole === "ADMIN";
  const wishlisted = isInWishlist(product.id);
  const productSummary =
    product.description ||
    `${product.name} from ${product.vendor.shopName}, available for online fashion shopping in Nepal.`;

  useEffect(() => {
    if (!pincode) {
      setDeliveryMessage(t("enter_pincode_hint"));
    }
  }, [pincode, t]);

  useEffect(() => {
    if (!mobileZoomOpen) {
      setMobileZoomScale(1);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileZoomOpen]);

  useEffect(() => {
    const storedPincode = window.localStorage.getItem("fitbazar_pincode");
    if (!storedPincode) return;
    setPincode(storedPincode);
    const result = getDeliveryMessage(storedPincode);
    setDeliveryMessage(result.message);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      if (authStatus === "loading") return;
      if (authStatus === "unauthenticated") {
        setReviews(product.reviews);
        setCanReview(false);
        setHasDeliveredOrder(false);
        setExistingReview(null);
        setReviewsLoading(false);
        return;
      }

      setReviewsLoading(true);
      try {
        const response = await fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`, { cache: "no-store" });
        const data = await response.json();
        if (!active) return;

        if (response.ok) {
          setReviews(data.reviews || []);
          setCanReview(Boolean(data.canReview));
          setHasDeliveredOrder(Boolean(data.hasDeliveredOrder));
          setExistingReview(data.existingReview || null);
          if (data.existingReview) {
            setReviewRating(data.existingReview.rating || 5);
            setReviewComment(data.existingReview.comment || "");
          } else {
            setReviewRating(5);
            setReviewComment("");
          }
        }
      } catch {
        if (active) {
          setReviews(product.reviews);
        }
      } finally {
        if (active) setReviewsLoading(false);
      }
    }

    void loadReviews();
    return () => {
      active = false;
    };
  }, [authStatus, product.id, product.reviews]);

  const ratingData = useMemo(() => {
    if (!reviews.length) {
      return { average: 4.7, count: 0 };
    }

    const average =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return { average: Number(average.toFixed(1)), count: reviews.length };
  }, [reviews]);

  const requireSize = product.sizes.length > 0;

  const handleAddToCart = () => {
    if (blocksShopping) {
      addToast(t("vendor_account_shopping_blocked"), "error");
      return false;
    }

    if (requireSize && !selectedSize) {
      addToast(t("select_size"), "error");
      return false;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      originalPrice: product.compareAtPrice ?? undefined,
      image: safeImages[0] || "",
      vendorId: product.vendor.id,
      vendorName: product.vendor.shopName,
      vendorSlug: product.vendor.slug,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });

    setAdded(true);
    addToast(t("added_to_bag"), "success");
    window.setTimeout(() => setAdded(false), 1500);
    return true;
  };

  const handleBuyNow = () => {
    if (handleAddToCart()) {
      router.push("/checkout");
    }
  };

  const handleToggleWishlist = () => {
    if (blocksShopping) {
      addToast(t("vendor_account_shopping_blocked"), "error");
      return;
    }

    if (wishlisted) {
      removeWishlistItem(product.id);
      addToast(t("removed_from_wishlist"), "info");
      return;
    }

    addWishlistItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      originalPrice: product.compareAtPrice ?? undefined,
      image: safeImages[0] || "",
      vendorName: product.vendor.shopName,
      vendorSlug: product.vendor.slug,
    });
    addToast(t("added_to_wishlist"), "success");
  };

  const handleCheckDelivery = () => {
    const result = getDeliveryMessage(pincode);
    setDeliveryMessage(result.message);
    if (result.ok) {
      window.localStorage.setItem("fitbazar_pincode", pincode.trim());
    }
  };

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewMessage("");

    if (authStatus !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`${window.location.pathname}${window.location.hash}`)}`);
      return;
    }

    if (!canReview && !existingReview) {
      setReviewMessage(t("review_after_delivery"));
      return;
    }

    setReviewSaving(true);
    try {
      const response = await fetch("/api/reviews", {
        method: existingReview ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          existingReview
            ? {
                reviewId: existingReview.id,
                rating: reviewRating,
                comment: reviewComment,
              }
            : {
                productId: product.id,
                rating: reviewRating,
                comment: reviewComment,
              },
        ),
      });
      const data = await response.json();

      if (!response.ok) {
        const message = data.error || t("failed_to_submit_review");
        setReviewMessage(message);
        addToast(message, "error");
        return;
      }

      const savedReview = data.review as ProductReview;
      setReviews((current) => {
        const withoutSaved = current.filter((review) => review.id !== savedReview.id);
        return [savedReview, ...withoutSaved];
      });
      setExistingReview({
        id: savedReview.id,
        rating: savedReview.rating,
        comment: savedReview.comment,
      });
      setCanReview(true);
      setHasDeliveredOrder(true);
      setReviewMessage(t("product_review_saved"));
      addToast(t("product_review_saved"), "success");
    } catch {
      setReviewMessage(t("failed_to_submit_review"));
      addToast(t("failed_to_submit_review"), "error");
    } finally {
      setReviewSaving(false);
    }
  };

  const activeMobileImage = safeImages[mobileImageIndex] || safeImages[0] || FALLBACK_PRODUCT_IMAGE;
  const roundedRating = Math.max(0, Math.min(5, Math.round(ratingData.average)));
  const reviewLabel = ratingData.count === 1 ? "1 Review" : `${ratingData.count} Reviews`;
  const mobileServices = [
    { icon: Truck, title: "Free Delivery", subtitle: "On all orders" },
    { icon: PackageCheck, title: "Easy Return", subtitle: "7 days return" },
    { icon: ShieldCheck, title: "Secure Payment", subtitle: "100% secure" },
    { icon: BadgeCheck, title: "Authentic", subtitle: "Original product" },
  ];

  return (
    <div className="container pb-28 pt-4 md:py-6 lg:pb-6">
      <section className="lg:hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setMobileZoomOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setMobileZoomOpen(true);
            }
          }}
          className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]"
          aria-label={`Zoom ${product.name} image`}
        >
          <SmartImage
            src={activeMobileImage}
            alt={product.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleToggleWishlist();
            }}
            className="absolute right-4 top-4 z-[2] flex h-12 w-12 items-center justify-center rounded-full bg-white text-text-primary shadow-[0_10px_24px_rgba(32,26,23,0.14)]"
            aria-label={t("toggle_wishlist")}
          >
            <Heart className={`h-5 w-5 ${wishlisted ? "fill-fb-pink text-fb-pink" : ""}`} />
          </button>
          <div className="absolute bottom-3 right-3 z-[2] flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-text-secondary shadow-[var(--shadow-sm)] backdrop-blur-md">
            <Maximize2 className="h-3.5 w-3.5" />
            Zoom
          </div>
        </div>

        {safeImages.length > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            {safeImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setMobileImageIndex(index)}
                className={`h-2 rounded-full transition-all ${index === mobileImageIndex ? "w-6 bg-fb-pink" : "w-2 bg-border-default"}`}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-5">
          <Link href={`/shop/${product.vendor.slug}`} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            {product.vendor.shopName}
          </Link>
          <h1 className="mt-1 text-[1.85rem] font-bold leading-tight tracking-[-0.03em] text-text-primary">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-[#FFC94A]">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`h-4 w-4 ${value <= roundedRating ? "fill-[#FFC94A]" : "fill-transparent"}`}
                />
              ))}
            </div>
            <span className="text-[13px] font-semibold text-text-primary">{ratingData.average.toFixed(1)}</span>
            <span className="text-[13px] text-text-muted">({reviewLabel})</span>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <span className="text-[1.85rem] font-bold leading-none tracking-[-0.04em] text-text-primary">{formatPriceNpr(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <>
                <span className="text-[14px] text-text-muted line-through">{formatPriceNpr(product.compareAtPrice)}</span>
                <span className="rounded-[8px] bg-fb-pink-bg px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-fb-pink">
                  {product.discountPct}% OFF
                </span>
              </>
            ) : null}
          </div>
          <p className="mt-2 text-[13px] text-text-muted">{t("inclusive_taxes")}</p>
        </div>

        <hr className="my-5" />

        {product.sizes.length ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[15px] font-bold text-text-primary">{t("select_size")}</span>
              <button type="button" className="flex items-center gap-1.5 text-[13px] font-bold text-fb-pink">
                {t("size_chart")}
                <Ruler className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`flex h-14 min-w-14 items-center justify-center rounded-full border px-5 text-[15px] font-semibold ${
                    selectedSize === size
                      ? "border-fb-pink bg-fb-pink text-white shadow-[0_12px_22px_rgba(255,63,108,0.22)]"
                      : "border-border-light bg-white text-text-primary"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {product.colors.length ? (
          <div className="mt-5">
            <div className="mb-3 text-[15px] font-bold text-text-primary">
              {t("color")}: <span className="font-medium text-text-secondary">{selectedColor}</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                    selectedColor === color ? "border-fb-pink" : "border-transparent"
                  }`}
                  aria-label={`Select ${color}`}
                >
                  <span
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ backgroundColor: swatchColor(color) }}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-4 gap-2 rounded-[18px] bg-[var(--bg-surface)] p-3">
          {mobileServices.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="min-w-0 text-center">
                <Icon className="mx-auto h-5 w-5 text-text-primary" />
                <div className="mt-1 text-[10px] font-bold leading-tight text-text-primary">{item.title}</div>
                <div className="mt-0.5 text-[9px] leading-tight text-text-muted">{item.subtitle}</div>
              </div>
            );
          })}
        </div>

        {blocksShopping ? (
          <div className="mt-5 rounded-[14px] border border-border-light bg-[var(--bg-surface)] p-4">
            <p className="text-[14px] font-semibold text-text-primary">{t("customer_account_required")}</p>
            <p className="mt-1 text-[13px] text-text-muted">{t("vendor_account_shopping_blocked")}</p>
          </div>
        ) : null}

        <div className="mt-5 rounded-[18px] border border-border-light bg-white p-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">{t("product_details")}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{productSummary}</p>
        </div>

        <div className="mt-4 rounded-[18px] border border-border-light bg-white p-4">
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">{t("delivery")}</div>
          <div className="flex gap-2">
            <input value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder={t("enter_pincode")} />
            <button type="button" onClick={handleCheckDelivery} className="btn-ghost shrink-0 px-4 py-2">
              {t("check")}
            </button>
          </div>
          <p className="mt-2 text-[12px] text-text-secondary">{deliveryMessage}</p>
        </div>
      </section>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[52%_48%] lg:gap-6">
        <section className="section-shell !p-3 md:!p-5 lg:!p-6">
          <ImageGallery images={safeImages} productName={product.name} />
        </section>

        <section className="section-shell !p-4 md:!p-5 lg:sticky lg:top-[76px] lg:h-fit lg:!p-6">
          <Link href={`/shop/${product.vendor.slug}`} className="text-[13px] font-bold uppercase text-text-primary md:text-[16px]">
            {product.vendor.shopName}
          </Link>
          <h1 className="mt-1 text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-text-primary md:mt-2 md:text-[2rem] md:tracking-[-0.05em]">{product.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-text-secondary md:mt-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-[#FFC94A] text-[#FFC94A]" />
              <span>{ratingData.average}</span>
            </div>
            <span>{ratingData.count} {t("ratings_reviews_title")}</span>
            <span>|</span>
            <Link href={`/shop/${product.vendor.slug}`} className="text-fb-pink">
              {t("more_by_vendor")} {product.vendor.shopName}
            </Link>
          </div>

          <hr className="my-3 md:my-4" />

          <div className="py-1">
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-[12px] text-text-muted">MRP:</span>
              <span className="text-[22px] font-bold text-text-primary md:text-[24px]">{formatPriceNpr(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price ? (
                <>
                  <span className="text-[14px] text-text-muted line-through">{formatPriceNpr(product.compareAtPrice)}</span>
                  <span className="text-[14px] font-semibold text-fb-orange">{product.discountPct}% OFF</span>
                </>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-text-muted">{t("inclusive_taxes")}</p>
          </div>

          {product.sizes.length ? (
            <div className="mt-4 md:mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("select_size")}</span>
                <button type="button" className="text-[12px] font-semibold text-fb-pink">
                  {t("size_chart")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-[20px] border px-4 py-2 text-[12px] font-medium ${selectedSize === size ? "border-fb-pink bg-fb-pink-bg text-fb-pink" : "border-border-default text-text-secondary"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {product.colors.length ? (
            <div className="mt-4 md:mt-5">
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">
                {t("color")}: <span className="text-text-primary">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-[20px] border px-3 py-2 text-[12px] font-medium ${selectedColor === color ? "border-fb-pink bg-fb-pink-bg text-fb-pink" : "border-border-default text-text-secondary"}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-5">
            <span className="text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("quantity_short")}:</span>
            <div className="flex items-center rounded-[20px] border border-border-default">
              <button
                type="button"
                disabled={quantity === 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="px-3 py-2 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[36px] text-center text-[13px] font-semibold">{quantity}</span>
              <button
                type="button"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                className="px-3 py-2 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-[12px] text-text-muted">{product.stock} {t("left_in_stock")}</span>
          </div>

          {blocksShopping ? (
            <div className="mt-6 rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4">
              <p className="text-[14px] font-semibold text-text-primary">{t("customer_account_required")}</p>
              <p className="mt-1 text-[13px] text-text-muted">{t("vendor_account_shopping_blocked")}</p>
              <Link href={accountRole === "ADMIN" ? "/admin" : "/vendor/dashboard"} className="btn-primary mt-4 inline-flex">
                {accountRole === "ADMIN" ? t("admin_panel") : t("go_to_vendor_dashboard")}
              </Link>
            </div>
          ) : (
            <div className="mt-6 hidden space-y-3 lg:block">
              <button type="button" onClick={handleAddToCart} className="btn-ghost flex h-[52px] w-full items-center justify-center">
                {added ? t("added_check") : t("add_to_cart")}
              </button>
              <button type="button" onClick={handleBuyNow} className="btn-primary flex h-[52px] w-full items-center justify-center">
                {t("buy_now")}
              </button>
            </div>
          )}

          <div className="mt-5 rounded-[20px] border border-border-light bg-[var(--bg-surface)] p-4">
            <div className="text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("product_details")}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{productSummary}</p>
          </div>

          <div className="mt-5 rounded-[24px] border border-border-light p-4">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("delivery")}</div>
            <div className="flex gap-2">
              <input value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder={t("enter_pincode")} />
              <button type="button" onClick={handleCheckDelivery} className="btn-ghost shrink-0 px-4 py-2">
                {t("check")}
              </button>
            </div>
            <p className="mt-2 text-[12px] text-text-secondary">{deliveryMessage}</p>
          </div>

          {[
            { key: "care", title: t("material_care"), body: t("material_care_hint") },
            { key: "reviews", title: t("ratings_reviews_title"), body: ratingData.count ? `${ratingData.count} shoppers have rated this product ${ratingData.average} out of 5.` : t("be_first_review") },
          ].map((item) => (
            <div key={item.key} className="border-b border-border-light py-3">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === item.key ? "" : item.key)}
                className="flex w-full items-center justify-between text-left text-[14px] font-semibold uppercase text-text-primary"
              >
                {item.title}
                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${activeAccordion === item.key ? "rotate-180" : ""}`} />
              </button>
              {activeAccordion === item.key ? <p className="mt-2 text-[13px] text-text-secondary">{item.body}</p> : null}
            </div>
          ))}

          <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-border-light p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fb-pink-bg text-[14px] font-bold text-fb-pink">
              {product.vendor.shopName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-text-primary">{product.vendor.shopName}</div>
              <div className="text-[12px] text-text-muted">{product.vendor.category || t("verified_fitbazar_store")}</div>
            </div>
            <Link href={`/shop/${product.vendor.slug}`} className="btn-ghost px-3 py-2 text-[12px]">
              {t("visit_shop")}
            </Link>
          </div>
        </section>
      </div>

      {!blocksShopping ? (
        <div className="fixed inset-x-0 bottom-12 z-[999] border-t border-border-light bg-white/95 px-4 py-3 shadow-[0_-16px_35px_rgba(32,26,23,0.12)] backdrop-blur-md lg:hidden">
          <div className="mx-auto grid max-w-site grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex h-14 items-center justify-center gap-2 rounded-[18px] border border-fb-pink bg-white px-3 text-[14px] font-bold text-fb-pink"
            >
              <ShoppingBag className="h-4 w-4" />
              {added ? t("added_check") : t("add_to_cart")}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-fb-pink px-3 text-[14px] font-bold text-white shadow-[0_14px_26px_rgba(255,63,108,0.28)]"
            >
              <Zap className="h-4 w-4" />
              {t("buy_now")}
            </button>
          </div>
        </div>
      ) : null}

      {mobileZoomOpen ? (
        <div className="fixed inset-0 z-[1200] bg-black text-white lg:hidden">
          <div className="absolute inset-x-0 top-0 z-[2] flex items-center justify-between p-4">
            <button
              type="button"
              onClick={() => setMobileZoomOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/14 backdrop-blur-md"
              aria-label="Close zoom"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileZoomScale((value) => (value === 1 ? 1.8 : 1))}
              className="rounded-full bg-white/14 px-4 py-2 text-[13px] font-semibold backdrop-blur-md"
            >
              {mobileZoomScale === 1 ? "Tap to zoom" : "Zoom out"}
            </button>
          </div>
          <div
            className="h-full w-full overflow-auto"
            onClick={() => setMobileZoomScale((value) => (value === 1 ? 1.8 : 1))}
          >
            <div
              className="relative min-h-full min-w-full"
              style={{
                width: `${mobileZoomScale * 100}%`,
                height: `${mobileZoomScale * 100}%`,
              }}
            >
              <SmartImage
                src={activeMobileImage}
                alt={product.name}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      <section id="reviews" className="section mt-4 scroll-mt-24 rounded-[8px]">
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
              <h2>{t("ratings_reviews_title")}</h2>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-[42px] font-bold leading-none text-text-primary">{ratingData.count ? ratingData.average : "0.0"}</span>
                <span className="pb-1 text-[14px] font-semibold text-text-muted">/ 5</span>
              </div>
              <p className="mt-2 text-[14px] text-text-muted">
                {ratingData.count
                  ? t("product_rating_summary", { count: ratingData.count, rating: ratingData.average })
                  : t("first_review_hint")}
              </p>
            </div>

            <div className="rounded-[8px] border border-border-light bg-card p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-[16px] font-semibold text-text-primary">
                {existingReview ? t("update_your_review") : t("write_a_review")}
              </h3>
              {authStatus === "loading" || reviewsLoading ? (
                <p className="mt-3 text-[14px] text-text-muted">{t("loading_reviews")}</p>
              ) : authStatus !== "authenticated" ? (
                <div className="mt-4">
                  <p className="text-[14px] text-text-secondary">{t("login_to_review")}</p>
                  <button
                    type="button"
                    onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(`${window.location.pathname}#reviews`)}`)}
                    className="btn-primary mt-4 inline-flex"
                  >
                    {t("login")}
                  </button>
                </div>
              ) : canReview || existingReview ? (
                <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-muted">{t("your_rating")}</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewRating(value)}
                          className="rounded-full p-1 text-[#FFC94A]"
                          aria-label={t("rate_product_stars", { count: value })}
                        >
                          <Star className={`h-7 w-7 ${value <= reviewRating ? "fill-[#FFC94A]" : "fill-transparent"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    rows={4}
                    maxLength={1200}
                    placeholder={t("review_placeholder")}
                  />
                  {reviewMessage ? <p className="text-[13px] text-text-secondary">{reviewMessage}</p> : null}
                  <button type="submit" disabled={reviewSaving} className="btn-primary w-full disabled:opacity-60">
                    {reviewSaving ? t("saving") : existingReview ? t("update_review") : t("submit_review")}
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-[14px] text-text-secondary">
                  {hasDeliveredOrder ? t("review_after_delivery") : t("review_delivered_orders_only")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review.id} className="rounded-[8px] border border-border-light bg-card p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-semibold text-text-primary">{review.user.name || t("fitbazar_shopper")}</div>
                      <div className="text-[12px] text-text-muted">{new Date(review.createdAt).toLocaleDateString("en-NP")}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[13px] text-text-secondary">
                      <Star className="h-4 w-4 fill-[#FFC94A] text-[#FFC94A]" />
                      <span>{review.rating}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-[14px] text-text-secondary">{review.comment || t("review_without_comment")}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[8px] border border-border-light bg-card p-6 text-center shadow-[var(--shadow-sm)]">
                <h3>{t("no_reviews_yet")}</h3>
                <p className="mt-2 text-[14px] text-text-muted">{t("first_review_hint")}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section mt-4 rounded-[8px]">
        <div className="mb-4 px-4 md:px-6">
          <h2>{t("similar_products")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-4">
          {similarProducts.map((item) => (
            <ProductCard key={item.id} {...item} />
          ))}
        </div>
      </section>

      <section className="section rounded-[8px]">
        <div className="mb-4 px-4 md:px-6">
          <h2>{t("customers_also_bought")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-4">
          {alsoBoughtProducts.map((item) => (
            <ProductCard key={`alt-${item.id}`} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
