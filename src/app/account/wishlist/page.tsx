"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { Heart, ArrowRight } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useLanguage } from "@/lib/LanguageContext";

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlist();
  const { t } = useLanguage();

  return (
    <main className="bg-page">
      <Header />
      
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-fb-pink">{t("home")}</Link>
          <span>/</span>
          <Link href="/account/dashboard" className="hover:text-fb-pink">{t("account")}</Link>
          <span>/</span>
          <span className="font-medium text-text-primary">{t("wishlist")}</span>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h1 className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-fb-pink" />
            {t("wishlist")}
          </h1>
          <p className="text-text-muted">{items.length} {t("items_label")}</p>
        </div>

        {items.length > 0 ? (
          <>
            <div className="mb-8 grid grid-cols-2 gap-[1px] bg-page md:grid-cols-3 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} id={product.productId} slug={product.slug} name={product.name} price={product.price} originalPrice={product.originalPrice} images={[product.image]} vendorName={product.vendorName} vendorSlug={product.vendorSlug} />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={clearWishlist}
                className="rounded-[4px] border border-border-default px-6 py-3 font-semibold text-text-secondary transition-colors hover:border-fb-pink hover:text-fb-pink"
              >
                {t("clear_wishlist")}
              </button>
              <Link 
                href="/products"
                className="btn-primary flex items-center justify-center gap-2"
              >
                {t("add_more_items")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--bg-surface)]">
              <Heart className="w-12 h-12 text-text-muted" />
            </div>
            <h2 className="mb-4 text-[24px] font-semibold text-text-primary">{t("your_wishlist_empty")}</h2>
            <p className="mb-8 text-text-muted">{t("wishlist_empty_hint")}</p>
            <Link href="/products" className="btn-primary inline-block">
              {t("shop_now")}
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
