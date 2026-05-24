"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Minus, Plus, Star } from "lucide-react";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import ImageGallery from "@/components/ImageGallery";
import { formatPriceNpr } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/ToastContext";
import { getDeliveryMessage } from "@/lib/pincode";
import { useLanguage } from "@/lib/LanguageContext";
import { getSafeImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/media";

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
    reviews: Array<{
      id: string;
      rating: number;
      comment?: string | null;
      createdAt: string;
      user: {
        id: string;
        name?: string | null;
        image?: string | null;
      };
    }>;
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

  const ratingData = useMemo(() => {
    if (!product.reviews.length) {
      return { average: 4.7, count: 0 };
    }

    const average =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;

    return { average: Number(average.toFixed(1)), count: product.reviews.length };
  }, [product.reviews]);

  const requireSize = product.sizes.length > 0;

  const handleAddToCart = () => {
    if (requireSize && !selectedSize) {
      addToast(t("select_size"), "error");
      return;
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
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handleCheckDelivery = () => {
    const result = getDeliveryMessage(pincode);
    setDeliveryMessage(result.message);
    if (result.ok) {
      window.localStorage.setItem("fitbazar_pincode", pincode.trim());
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
          <p className="mt-2 text-[0.98rem] text-text-secondary">Premium marketplace presentation with faster selection, clearer pricing, and mobile-first purchase controls.</p>

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

          <div className="mt-6 space-y-3">
            <button type="button" onClick={handleAddToCart} className="btn-ghost flex h-[52px] w-full items-center justify-center">
              {added ? t("added_check") : t("add_to_cart")}
            </button>
            <button type="button" onClick={handleBuyNow} className="btn-primary flex h-[52px] w-full items-center justify-center">
              {t("buy_now")}
            </button>
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

      <section className="section mt-4 rounded-[8px]">
        <div className="mb-4 px-4 md:px-6">
          <h2>{t("ratings_reviews_title")}</h2>
        </div>
        <div className="space-y-3 px-4 md:px-6">
          {product.reviews.length ? (
            product.reviews.map((review) => (
              <div key={review.id} className="rounded-[8px] border border-border-light p-4">
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
                <p className="mt-3 text-[14px] text-text-secondary">{review.comment || t("loved_quality_finish")}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[8px] border border-border-light p-6 text-center">
              <h3>{t("no_reviews_yet")}</h3>
              <p className="mt-2 text-[14px] text-text-muted">{t("first_review_hint")}</p>
            </div>
          )}
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
