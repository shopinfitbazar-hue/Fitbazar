"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmartImage from "@/components/ui/SmartImage";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { formatPriceNpr } from "@/lib/catalog";
import { useToast } from "@/lib/ToastContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const { addItem: addWishlistItem } = useWishlist();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPct: number } | null>(null);
  const delivery = total > 2000 ? 0 : 100;
  const finalTotal = total - couponDiscount + delivery;

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      addToast(t("enter_coupon_prompt"), "error");
      return;
    }

    try {
      const response = await fetch(`/api/cart/validate-coupon?code=${encodeURIComponent(couponCode.trim())}&subtotal=${total}`);
      const data = await response.json();

      if (!response.ok) {
        addToast(data.error || t("coupon_apply_failed"), "error");
        return;
      }

      setCouponDiscount(data.coupon.discountAmount);
      setAppliedCoupon({ code: data.coupon.code, discountPct: data.coupon.discountPct });
      addToast(`${data.coupon.code} ${t("coupon_applied_success")}`, "success");
    } catch {
      addToast(t("coupon_validation_failed"), "error");
    }
  };

  const moveToWishlist = (item: (typeof items)[number]) => {
    addWishlistItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      vendorName: item.vendorName || "Fit Bazar",
      vendorSlug: item.vendorSlug,
      slug: item.slug,
    });
    removeItem(item.id);
    addToast(t("moved_to_wishlist"), "success");
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-4">
        {items.length === 0 ? (
          <div className="rounded-[8px] bg-card px-4 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-surface)]">
              <ShoppingBag className="h-8 w-8 text-text-muted" />
            </div>
            <h2 className="mt-4 text-[18px] font-semibold text-text-primary">{t("your_bag_empty")}</h2>
            <p className="mt-2 text-[14px] text-text-muted">{t("looks_like_empty_bag")}</p>
            <Link href="/products" className="btn-primary mt-5 inline-flex">
              {t("shop_now")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[65%_35%]">
            <section className="rounded-[8px] bg-card">
              <div className="border-b border-border-light px-4 py-4">
                <h1 className="text-[20px] font-semibold text-text-primary">{t("my_bag").toUpperCase()} ({items.length} {t("items_label")})</h1>
              </div>
              {items.map((item) => (
                <div key={item.id} className="border-b border-border-light px-4 py-4 last:border-b-0">
                  <div className="flex gap-4">
                    <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-[4px] bg-[var(--bg-surface)]">
                      <SmartImage src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-text-primary">{item.vendorName || "Fit Bazar"}</p>
                          <p className="mt-1 text-[14px] text-text-secondary">{item.name}</p>
                          <p className="mt-1 text-[13px] text-text-muted">{t("size")}: {item.size || t("free")}</p>
                          <p className="text-[13px] text-text-muted">{t("color")}: {item.color || "Default"}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-[14px] font-bold text-text-primary">{formatPriceNpr(item.price * item.quantity)}</div>
                          {item.originalPrice ? <div className="text-[12px] text-text-muted line-through">{formatPriceNpr(item.originalPrice * item.quantity)}</div> : null}
                          {item.originalPrice && item.originalPrice > item.price ? (
                            <div className="text-[12px] font-semibold text-fb-orange">
                              {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center rounded-[20px] border border-border-default">
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1.5">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[32px] text-center text-[13px] font-semibold">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1.5">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex gap-4 text-[12px] font-medium">
                          <button type="button" onClick={() => removeItem(item.id)} className="text-text-muted hover:text-fb-pink">
                            {t("remove")}
                          </button>
                          <button type="button" onClick={() => moveToWishlist(item)} className="text-fb-pink">
                            {t("move_to_wishlist")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-border-light px-4 py-4">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("apply_coupon")}</div>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder={t("enter_coupon_code")} />
                  <button type="button" onClick={applyCoupon} className="btn-primary px-5 py-2">
                    {t("apply_coupon")}
                  </button>
                </div>
                {appliedCoupon ? (
                  <p className="mt-2 text-[13px] text-success">
                    {appliedCoupon.code} {t("coupon_applied_success")}. {t("you_will_save")} {formatPriceNpr(couponDiscount)}.
                  </p>
                ) : null}
              </div>
            </section>

            <aside className="h-fit rounded-[8px] bg-card p-4 lg:sticky lg:top-[76px]">
              <div className="border-b border-border-light pb-3 text-[14px] font-semibold uppercase tracking-[1px] text-text-primary">
                {t("order_summary")}
              </div>
              <div className="space-y-3 py-4 text-[14px] text-text-secondary">
                <div className="flex justify-between">
                  <span>{t("price_items")} ({items.length} {t("items_label")})</span>
                  <span>{formatPriceNpr(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("discount")}</span>
                  <span className="text-success">- {formatPriceNpr(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("coupon_discount")}</span>
                  <span className="text-success">- {formatPriceNpr(couponDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("delivery_charges")}</span>
                  <span className="text-success">{delivery === 0 ? t("free").toUpperCase() : formatPriceNpr(delivery)}</span>
                </div>
              </div>
              <hr />
              <div className="flex justify-between py-4 text-[16px] font-bold text-text-primary">
                <span>{t("total_amount")}</span>
                <span>{formatPriceNpr(finalTotal)}</span>
              </div>
              <div className="rounded-[4px] bg-[var(--green-bg)] px-3 py-2 text-[13px] text-success">
                {t("you_will_save")} {formatPriceNpr(couponDiscount)} {t("on_this_order")}
              </div>
              <Link href={`/checkout${appliedCoupon ? `?coupon=${encodeURIComponent(appliedCoupon.code)}` : ""}`} className="btn-primary mt-4 flex h-12 w-full items-center justify-center text-[16px]">
                {t("proceed_checkout")}
              </Link>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
