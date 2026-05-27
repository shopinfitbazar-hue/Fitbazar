"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown, Minus, Plus, Star } from "lucide-react";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import ImageGallery from "@/components/ImageGallery";
import { formatPriceNpr } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
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

export default function ProductDetailClient({
  product,
  similarProducts,
  alsoBoughtProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: session, status: authStatus } = useSession();
  const { addItem } = useCart();
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
  const [activeAccordion, setActiveAccordion] = useState("details");
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
  const accountRole = session?.user?.role;
  const blocksShopping = accountRole === "VENDOR" || accountRole === "ADMIN";

  useEffect(() => {
    if (!pincode) {
      setDeliveryMessage(t("enter_pincode_hint"));
    }
  }, [pincode, t]);

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

  return (
    <div className="container py-6">
      <div className="grid gap-6 lg:grid-cols-[55%_45%]">
        <section className="section-shell">
          <ImageGallery images={safeImages} productName={product.name} />
        </section>

        <section className="section-shell lg:sticky lg:top-[76px] lg:h-fit">
          <Link href={`/shop/${product.vendor.slug}`} className="text-[16px] font-bold uppercase text-text-primary">
            {product.vendor.shopName}
          </Link>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-text-primary">{product.name}</h1>
          <p className="mt-2 text-[0.98rem] text-text-secondary">
            {product.description || `${product.name} from ${product.vendor.shopName}, available for online fashion shopping in Nepal.`}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-text-secondary">
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

          <hr className="my-4" />

          <div className="py-1">
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-[12px] text-text-muted">MRP:</span>
              <span className="text-[24px] font-bold text-text-primary">{formatPriceNpr(product.price)}</span>
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
            <div className="mt-5">
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
            <div className="mt-5">
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

          <div className="mt-5 flex items-center gap-3">
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
            <div className="mt-6 space-y-3">
              <button type="button" onClick={handleAddToCart} className="btn-ghost flex h-[52px] w-full items-center justify-center">
                {added ? t("added_check") : t("add_to_cart")}
              </button>
              <button type="button" onClick={handleBuyNow} className="btn-primary flex h-[52px] w-full items-center justify-center">
                {t("buy_now")}
              </button>
            </div>
          )}

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
            { key: "details", title: t("product_details"), body: product.description || t("authentic_nepali_fashion") },
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
