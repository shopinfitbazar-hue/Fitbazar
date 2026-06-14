"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Baby,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  Gem,
  Grid3X3,
  RotateCcw,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  Watch,
  type LucideIcon,
} from "lucide-react";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import VendorCard from "@/components/VendorCard";
import LaunchingSoonPromo from "@/components/LaunchingSoonPromo";
import SectionHeading from "@/components/ui/SectionHeading";
import SmartImage from "@/components/ui/SmartImage";
import {
  categorySlug,
  collectionHrefForCategory,
  fashionCategoryLinks,
  isFashionCategoryName,
  normalizeCategory,
  type FashionCategoryIconKey,
  type FashionCategoryLink,
} from "@/lib/categories";
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
  allShopProducts: ProductCardProps[];
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
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
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

const categoryIcons: Record<FashionCategoryIconKey, LucideIcon> = {
  men: Shirt,
  women: Shirt,
  kids: Baby,
  ethnic: Sparkles,
  sportswear: Dumbbell,
  footwear: Footprints,
  accessories: Gem,
  bags: ShoppingBag,
  watches: Watch,
  streetwear: Sparkles,
  hoodies: Shirt,
  sale: Tag,
};

function getCategoryIcon(iconKey: FashionCategoryIconKey) {
  return categoryIcons[iconKey] ?? ShoppingBag;
}

function getCategoryIconKey(name: string): FashionCategoryIconKey {
  const slug = categorySlug(name);
  if (slug === "men") return "men";
  if (slug === "women") return "women";
  if (slug === "kids") return "kids";
  if (slug === "ethnic" || slug === "ethnic-wear") return "ethnic";
  if (slug === "sports" || slug === "sportswear") return "sportswear";
  if (slug === "footwear" || slug === "shoes") return "footwear";
  if (slug === "streetwear") return "streetwear";
  if (slug === "hoodies") return "hoodies";
  if (slug === "sale" || slug === "all-sale") return "sale";
  return "accessories";
}

export default function HomePageClient({
  banners,
  categories,
  mostPopular,
  allShopProducts,
  festivalProducts,
  yearRoundProducts,
  specialDiscounts,
  vendors,
  festival,
  hero,
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

  const displayCategories = useMemo(() => {
    const seen = new Set<string>();
    const items: FashionCategoryLink[] = [];
    const add = (item: FashionCategoryLink) => {
      if (seen.has(item.href)) return;
      seen.add(item.href);
      items.push(item);
    };

    fashionCategoryLinks.slice(0, 10).forEach(add);
    categories
      .filter((category) => isFashionCategoryName(category.name))
      .forEach((category) => {
        const href = collectionHrefForCategory(category.name);
        const existing = fashionCategoryLinks.find(
          (item) => item.href === href || normalizeCategory(item.category) === normalizeCategory(category.name),
        );
        add(
          existing ?? {
            label: category.name,
            shortLabel: category.name,
            href,
            category: normalizeCategory(category.name),
            slug: category.slug || categorySlug(category.name),
            iconKey: getCategoryIconKey(category.name),
            description: `Explore ${category.name.toLowerCase()} picks`,
          },
        );
      });

    return items.slice(0, 10);
  }, [categories]);

  const activeBannerItem = banners[activeBanner];
  const productGridClass = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4";
  const trustBadges = [
    { label: "Fast Delivery", detail: "Selected orders", icon: Truck },
    { label: "Easy Return", detail: "7 days return", icon: RotateCcw },
    { label: "Secure Payment", detail: "Protected checkout", icon: ShieldCheck },
    { label: "Authentic Shops", detail: "Approved sellers", icon: BadgeCheck },
  ];
  return (
    <div className="container py-6">
      <section className="section">
        <div className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="hidden rounded-[8px] border border-border-light bg-white p-4 shadow-[var(--shadow-card)] xl:block">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-[#b98745]">
              <Grid3X3 className="h-4 w-4" strokeWidth={1.8} />
              Shop by Category
            </div>
            <div className="space-y-1">
              {displayCategories.slice(0, 9).map((category) => {
                const Icon = getCategoryIcon(category.iconKey);
                return (
                  <Link
                    key={`rail-${category.slug}`}
                    href={category.href}
                    className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3 rounded-[6px] px-2 py-2 text-[13px] text-text-secondary hover:bg-[var(--bg-surface)] hover:text-[#101827]"
                  >
                    <Icon className="h-4 w-4 text-[#101827]" strokeWidth={1.7} />
                    <span className="truncate">{category.label}</span>
                  </Link>
                );
              })}
            </div>
            <Link href="/launching-soon" className="mt-4 grid grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-[8px] bg-[var(--bg-surface)] p-3">
              <span className="relative h-12 w-[42px] overflow-hidden rounded-[6px] bg-[#101827]">
                <SmartImage
                  src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=240&q=70"
                  alt="Launching Soon"
                  fill
                  sizes="42px"
                  className="object-cover opacity-80"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-semibold text-[#101827]">Launching Soon</span>
                <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-text-muted">India to Nepal delivery</span>
              </span>
            </Link>
          </aside>

          <div className="hero-shell relative min-h-[300px] overflow-hidden rounded-[8px] p-5 md:min-h-[380px] md:p-8">
            <div className="absolute inset-0">
              {banners.length ? (
                <SmartImage
                  src={activeBannerItem?.imageUrl}
                  alt={activeBannerItem?.title || t("hero_banner_alt")}
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 70vw"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,243,0.92)_0%,rgba(255,250,243,0.72)_40%,rgba(16,24,39,0.08)_100%)]" />
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(90deg,rgba(255,250,243,0)_0%,rgba(16,24,39,0.18)_100%)]" />
            </div>

            {activeBannerItem?.linkUrl ? (
              <Link
                href={getSafeHref(activeBannerItem.linkUrl, "/")}
                className="absolute inset-0 z-0"
                aria-label={activeBannerItem.title || t("hero_banner_alt")}
              />
            ) : null}

            <div className="relative z-[1] max-w-[32rem]">
              <div className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#b98745]">
                <Sparkles className="h-3.5 w-3.5 text-[#b98745]" />
                {hero.eyebrow}
              </div>
              <h1 className="mt-4 max-w-[28rem] text-[#101827] md:mt-5">{hero.title}</h1>
              <p className="mt-3 max-w-[28rem] text-[0.95rem] font-medium text-text-secondary md:text-[1rem]">
                {hero.subtitle}
              </p>
              <div className="relative z-[2] mt-6 flex flex-wrap gap-3">
                <Link href={hero.primaryHref} className="btn-primary">
                  {hero.primaryLabel}
                </Link>
                <Link href={hero.secondaryHref} className="btn-ghost bg-white text-[#101827] hover:text-[#101827]">
                  {hero.secondaryLabel}
                </Link>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 z-[2] hidden w-[190px] rounded-[8px] border border-white/30 bg-[#b98745]/90 p-4 text-white shadow-[var(--shadow-card)] backdrop-blur-md md:block">
              <p className="text-[12px] font-semibold text-white">Exclusive Offer</p>
              <p className="mt-5 text-[13px] text-white/88">Up to</p>
              <p className="text-[2rem] font-bold leading-none text-white">50% OFF</p>
              <p className="mt-1 text-[12px] text-white">On selected items</p>
            </div>

            {banners.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveBanner((current) => (current - 1 + banners.length) % banners.length)}
                  className="absolute bottom-5 right-16 z-[2] flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-[var(--shadow-sm)] backdrop-blur-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBanner((current) => (current + 1) % banners.length)}
                  className="absolute bottom-5 right-5 z-[2] flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-[var(--shadow-sm)] backdrop-blur-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : null}

            <div className="absolute bottom-5 left-5 z-[2] flex gap-2 md:left-8">
              {(banners.length ? banners : [null]).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveBanner(index)}
                  className={`rounded-full transition-all ${index === activeBanner ? "h-2.5 w-8 bg-[#b98745]" : "h-2.5 w-2.5 bg-[#101827]/20"}`}
                  aria-label={t("go_to_banner", { index: String(index + 1) })}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Browse"
            title="Shop by mood, category, and occasion"
            subtitle="Find everyday wear, festive looks, and local store picks in a few quick taps."
          />
          <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {displayCategories.map((category, index) => {
              const Icon = getCategoryIcon(category.iconKey);
              return (
                <Link
                  key={category.slug}
                  href={category.href}
                  className="min-w-[92px] text-center"
                >
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-[8px] border border-border-light text-text-primary shadow-[var(--shadow-sm)]"
                    style={{ backgroundColor: ["#f8dcd7", "#f7e7d5", "#e3efe9", "#e9edf7"][index % 4] }}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <div className="mt-3 text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">{category.shortLabel}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
          {[
            {
              eyebrow: "Men's Collection",
              title: "Sharp daily fits",
              href: "/collections/mens-fashion-nepal",
              image: mostPopular[0]?.images?.[0] || activeBannerItem?.imageUrl,
            },
            {
              eyebrow: "Women's Collection",
              title: "Festive to everyday",
              href: "/collections/womens-fashion-nepal",
              image: mostPopular[1]?.images?.[0] || activeBannerItem?.imageUrl,
            },
          ].map((item) => (
            <Link
              key={item.eyebrow}
              href={item.href}
              className="group relative min-h-[176px] overflow-hidden rounded-[8px] bg-card shadow-[var(--shadow-card)]"
            >
              <SmartImage
                src={item.image}
                alt={item.eyebrow}
                fill
                sizes="(max-width: 1023px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(32,26,23,0.72)_0%,rgba(32,26,23,0.26)_68%,rgba(32,26,23,0)_100%)]" />
              <div className="absolute inset-y-0 left-0 flex max-w-[16rem] flex-col justify-center p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/76">{item.eyebrow}</p>
                <h2 className="mt-2 text-[1.45rem] leading-tight text-white">{item.title}</h2>
                <span className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-white">Shop now</span>
              </div>
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-3 rounded-[8px] border border-border-light bg-card p-4 shadow-[var(--shadow-card)]">
            {trustBadges.map((item) => (
              <div key={item.label} className="min-w-0 rounded-[6px] bg-[var(--bg-surface)] p-3">
                <item.icon className="h-5 w-5 text-fb-pink" strokeWidth={1.8} />
                <p className="mt-3 truncate text-[13px] font-semibold text-text-primary">{item.label}</p>
                <p className="mt-1 line-clamp-1 text-[11px] text-text-muted">{item.detail}</p>
              </div>
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
          <div className={productGridClass}>
            {mostPopular.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {allShopProducts.length ? (
        <section className="section">
          <div className="section-shell">
            <SectionHeading
              eyebrow="All Shops"
              title="Fresh Finds From Every Approved Store"
              subtitle="New drops, daily essentials, and fresh styles gathered across FitBazar."
              actionHref="/products"
              actionLabel={t("view_all")}
            />
            <div className={productGridClass}>
              {allShopProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
            <div className={productGridClass}>
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
          <div className={productGridClass}>
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
            actionHref="/collections/sale"
            actionLabel={t("view_all")}
          />
          <div className={productGridClass}>
            {specialDiscounts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <LaunchingSoonPromo />
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
