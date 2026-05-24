"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import VendorSidebar from "@/components/VendorSidebar";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import { useLanguage } from "@/lib/LanguageContext";

type PreviewData = {
  vendor: {
    id: string;
    shopName: string;
    slug: string;
    description?: string | null;
    logo?: string | null;
    banner?: string | null;
    category?: string | null;
    isApproved: boolean;
    isSuspended: boolean;
  };
  products: ProductCardProps[];
};

export default function VendorStorePreviewPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPreview() {
      const [settingsResponse, productsResponse] = await Promise.all([
        fetch("/api/vendor/settings", { cache: "no-store" }),
        fetch("/api/vendor/products", { cache: "no-store" }),
      ]);

      const settingsData = await settingsResponse.json();
      const productsData = await productsResponse.json();

      if (!settingsResponse.ok) {
        setError(settingsData.error || t("vendor_access_unavailable"));
        return;
      }

      const vendor = settingsData.vendor;
      setData({
        vendor,
        products: (productsData.products || []).map((product: {
          id: string;
          slug: string;
          name: string;
          price: number;
          compareAtPrice?: number | null;
          discountPct: number;
          images: string[];
          sizes: string[];
          isFestivalSale: boolean;
          isYearRoundSale: boolean;
          vendorId?: string;
          category?: string;
          totalSold?: number;
        }) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          originalPrice: product.compareAtPrice ?? undefined,
          discountPercent: product.discountPct,
          images: product.images || [],
          vendorName: vendor.shopName,
          vendorSlug: vendor.slug,
          sizes: product.sizes || [],
          isFestival: product.isFestivalSale,
          isSale: product.isYearRoundSale || product.discountPct > 0,
          soldCount: product.totalSold || 0,
          rating: 4.7,
          reviewCount: 0,
        })),
      });
    }

    void loadPreview();
  }, [t]);

  return (
    <main className="bg-page">
      <Header />
      <div className="mx-auto flex max-w-site">
        <VendorSidebar
          shopName={data?.vendor.shopName}
          isApproved={data?.vendor.isApproved}
          isSuspended={data?.vendor.isSuspended}
          subtitle={t("store_preview")}
        />
        <section className="flex-1 p-4 md:p-6">
          <div className="rounded-[8px] bg-card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1>{t("store_preview")}</h1>
                <p className="mt-2 text-[14px] text-text-secondary">{t("store_preview_intro")}</p>
                {error ? <p className="mt-3 text-[12px] text-fb-pink">{error}</p> : null}
              </div>
              {data?.vendor.slug ? (
                <Link href={`/shop/${data.vendor.slug}`} className="btn-ghost">
                  {t("view_live_store")}
                </Link>
              ) : null}
            </div>
          </div>

          {data?.vendor ? (
            <div className="mt-4 rounded-[8px] bg-card p-5">
              <h2 className="text-[20px] font-semibold text-text-primary">{data.vendor.shopName}</h2>
              <p className="mt-2 text-[14px] text-text-secondary">{data.vendor.description || t("vendor_store_preview_fallback")}</p>
              <p className="mt-2 text-[12px] uppercase tracking-[1px] text-text-muted">
                {data.vendor.category || t("products")}
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-[8px] bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-text-primary">{t("products")}</h2>
              <span className="text-[13px] text-text-muted">{data?.products.length || 0} {t("products").toLowerCase()}</span>
            </div>
            <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-4">
              {data?.products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
            {data && data.products.length === 0 ? (
              <div className="py-8 text-center text-[14px] text-text-muted">{t("add_products_to_preview")}</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
