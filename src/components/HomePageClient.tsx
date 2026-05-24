"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import VendorCard from "@/components/VendorCard";
import SectionHeading from "@/components/ui/SectionHeading";
import SmartImage from "@/components/ui/SmartImage";
import { categoryQueryValue } from "@/lib/categories";
import { useLanguage } from "@/lib/LanguageContext";
import { getSafeHref } from "@/lib/media";

interface HomePageClientProps {
  banners: Array<{
    id: string;
    imageUrl: string;
    title?: string | null;
    linkUrl?: string | null;
  }>;
  categories: Array<{
    name: string;
    slug: string;
  }>;
  mostPopular: ProductCardProps[];
  festivalProducts: ProductCardProps[];
  yearRoundProducts: ProductCardProps[];
  specialDiscounts: ProductCardProps[];
  vendors: Array<{
    id: string;
    slug?: string;
    shopName: string;
    logo?: string;
    description?: string;
    rating: number;
    reviewCount: number;
    productCount: number;
    location?: string;
  }>;
  festival: {
    name: string;
    nameNp: string;
    endDate: string;
    isActive: boolean;
  } | null;
}

function formatCountdown(endDate: string) {
  const distance = new Date(endDate).getTime() - Date.now();
  if (distance <= 0) return "Ends today";

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);
  return `Ends in ${days} days ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function HomePageClient({
  banners,
  categories,
  mostPopular,
  festivalProducts,
  yearRoundProducts,
  specialDiscounts,
  vendors,
  festival,
}: HomePageClientProps) {
  const { t } = useLanguage();
  const [activeBanner, setActiveBanner] = useState(0);
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!banners.length) return;
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % banners.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (!festival?.isActive) {
      setCountdown(null);
      return;
    }

    setCountdown(formatCountdown(festival.endDate));
    const timer = window.setInterval(() => {
      setCountdown(formatCountdown(festival.endDate));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [festival]);

  const displayCategories = useMemo(
    () =>
      categories.length
        ? categories.slice(0, 8)
        : [
            { name: "Men", slug: "men" },
            { name: "Women", slug: "women" },
            { name: "Kids", slug: "kids" },
            { name: "Ethnic", slug: "ethnic" },
            { name: "Sports", slug: "sports" },
            { name: "Accessories", slug: "accessories" },
            { name: "Footwear", slug: "footwear" },
            { name: "All Sale", slug: "sale" },
          ],
    [categories],
  );

  const activeBannerItem = banners[activeBanner];

  return (
    <div className="container py-6">
      <section className="section">
        <div className="hero-shell relative overflow-hidden rounded-[32px] p-6 md:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-[46%] md:block">
            {banners.length ? (
              <SmartImage
                src={activeBannerItem?.imageUrl}
                alt={activeBannerItem?.title || t("hero_banner_alt")}
                fill
                priority
                sizes="(max-width: 767px) 100vw, 44vw"
                className="object-cover opacity-70"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(38,26,20,0.96)_0%,rgba(38,26,20,0.2)_50%,transparent_100%)]" />
          </div>

          <div className="relative z-[1] max-w-[36rem]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/88 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-white/88" />
              Nepal&apos;s premium fashion marketplace
            </div>
            <h1 className="mt-5 text-white">Discover sharper style, faster shopping, and curated Nepal-first fashion.</h1>
            <p className="mt-4 max-w-[30rem] text-[1rem] text-white/76">
              Mobile-first discovery, partner-led fashion drops, and cleaner product storytelling built for modern shoppers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                Shop New Arrivals
              </Link>
              <Link href="/discover" className="btn-ghost border-white/20 bg-white/10 text-white hover:text-text-primary">
                Explore Collections
              </Link>
            </div>
          </div>

          <div className="relative mt-8 md:mt-10">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Fast delivery signals", value: "95+" },
                { label: "Premium partner stores", value: "40+" },
                { label: "Fashion picks refreshed", value: "Daily" },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[1.5rem] font-semibold tracking-[-0.05em] text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-white/72">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {banners.length ? (
            <>
              {activeBannerItem?.linkUrl ? (
                <Link
                  href={getSafeHref(activeBannerItem.linkUrl, "/")}
                  className="absolute inset-0"
                  aria-label={activeBannerItem.title || t("hero_banner_alt")}
                />
              ) : null}
              {banners.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveBanner((current) => (current - 1 + banners.length) % banners.length)}
                    className="absolute bottom-6 right-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-[var(--shadow-sm)] backdrop-blur-md"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBanner((current) => (current + 1) % banners.length)}
                    className="absolute bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-[var(--shadow-sm)] backdrop-blur-md"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </>
          ) : null}

          <div className="relative z-[1] mt-8 flex justify-center gap-2 md:justify-start">
            {(banners.length ? banners : [null]).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveBanner(index)}
                className={`rounded-full transition-all ${index === activeBanner ? "h-2.5 w-10 bg-white" : "h-2.5 w-2.5 bg-white/38"}`}
                aria-label={t("go_to_banner", { index: String(index + 1) })}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Browse"
            title="Shop by mood, category, and occasion"
            subtitle="The homepage is restructured for fast scanning on mobile, with cleaner fashion-first entry points."
          />
          <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
          {displayCategories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/products?category=${encodeURIComponent(categoryQueryValue(category.name))}`}
              className="min-w-[92px] text-center"
            >
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/80 text-[14px] font-semibold text-text-primary shadow-[var(--shadow-sm)]"
                style={{ backgroundColor: ["#f8dcd7", "#f7e7d5", "#e3efe9", "#e9edf7"][index % 4] }}
              >
                {category.name.charAt(0)}
              </div>
              <div className="mt-3 text-[12px] font-medium uppercase tracking-[0.14em] text-text-secondary">{category.name}</div>
            </Link>
          ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Trending"
            title="Most Popular Right Now"
            subtitle="सबैभन्दा लोकप्रिय"
            actionHref="/products?sort=popularity"
          />
          <div className="grid auto-cols-[180px] grid-flow-col gap-4 overflow-x-auto pb-2 lg:auto-cols-[240px] [&::-webkit-scrollbar]:hidden">
          {mostPopular.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
          </div>
        </div>
      </section>

      {festival?.isActive && festivalProducts.length ? (
        <section className="section">
          <div className="section-shell">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
              <span className="badge badge-pink">Festival Sale</span>
              <h2>{festival.name}</h2>
              <span className="text-[13px] font-mono text-text-secondary">{countdown ?? "Ends soon"}</span>
              </div>
              <p className="text-sm text-text-secondary">{festival.nameNp}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {festivalProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-shell">
          <div className="mb-5 flex items-center gap-3">
            <h2>Always On Sale</h2>
            <span className="badge badge-green">Live</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {yearRoundProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Offers"
            title="Up to 50% Off — Special Picks"
            actionHref="/products?minDiscount=20&sort=discount"
            actionLabel={t("view_all")}
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {specialDiscounts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Marketplace"
            title={t("partnered_shops")}
            subtitle={t("top_shops_intro")}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} {...vendor} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
