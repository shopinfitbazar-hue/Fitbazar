"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { normalizeCategory } from "@/lib/categories";
import { useLanguage } from "@/lib/LanguageContext";

interface ProductApiItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  discountPct: number;
  images: string[];
  sizes: string[];
  totalSold: number;
  isFestivalSale: boolean;
  isYearRoundSale: boolean;
  vendor?: {
    id: string;
    shopName: string;
    slug: string;
  };
  reviews?: Array<{ rating: number }>;
  _count?: {
    reviews?: number;
  };
}

const sortOptions = [
  { labelKey: "recommended", value: "newest" },
  { labelKey: "whats_new", value: "newest" },
  { labelKey: "popularity", value: "popularity" },
  { labelKey: "price_low_high", value: "price_asc" },
  { labelKey: "price_high_low", value: "price_desc" },
  { labelKey: "better_discount", value: "discount" },
];

const discountOptions = [
  { labelKey: "discount_10_above", value: "10" },
  { labelKey: "discount_20_above", value: "20" },
  { labelKey: "discount_30_above", value: "30" },
  { labelKey: "discount_40_above", value: "40" },
  { labelKey: "discount_50_above", value: "50" },
];

function ProductsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const searchParamsString = searchParams?.toString() || "";
  const currentSort = searchParams?.get("sort") || "newest";
  const currentSizes = useMemo(() => new URLSearchParams(searchParamsString).getAll("size"), [searchParamsString]);
  const currentColors = useMemo(() => new URLSearchParams(searchParamsString).getAll("color"), [searchParamsString]);
  const currentCategory = normalizeCategory(searchParams?.get("category") || null);
  const currentDiscount = searchParams?.get("minDiscount") || "";
  const currentMaxPrice = Number(searchParams?.get("maxPrice") || 10000);

  const [selectedSort, setSelectedSort] = useState(currentSort);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(currentSizes);
  const [selectedColors, setSelectedColors] = useState<string[]>(currentColors);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [selectedDiscount, setSelectedDiscount] = useState(currentDiscount);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ categories: string[]; sizes: string[]; colors: string[] }>({
    categories: [],
    sizes: [],
    colors: [],
  });

  const updateParams = (next: {
    sort?: string;
    category?: string;
    minDiscount?: string;
    maxPrice?: number;
    sizes?: string[];
    colors?: string[];
  }) => {
    const params = new URLSearchParams(searchParamsString);

    const sort = next.sort ?? selectedSort;
    const category = normalizeCategory(next.category ?? selectedCategory);
    const minDiscount = next.minDiscount ?? selectedDiscount;
    const max = next.maxPrice ?? maxPrice;
    const sizes = next.sizes ?? selectedSizes;
    const colors = next.colors ?? selectedColors;

    params.set("sort", sort);
    params.set("maxPrice", String(max));

    if (category) params.set("category", category);
    else params.delete("category");

    if (minDiscount) params.set("minDiscount", minDiscount);
    else params.delete("minDiscount");

    params.delete("size");
    sizes.forEach((size) => params.append("size", size));

    params.delete("color");
    colors.forEach((color) => params.append("color", color));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setSelectedSort(currentSort);
    setSelectedSizes(currentSizes);
    setSelectedColors(currentColors);
    setSelectedCategory(currentCategory);
    setSelectedDiscount(currentDiscount);
    setMaxPrice(currentMaxPrice);
  }, [currentCategory, currentColors, currentDiscount, currentMaxPrice, currentSizes, currentSort]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    if (!params.get("sort")) params.set("sort", "newest");
    if (!params.get("maxPrice")) params.set("maxPrice", "10000");

    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load products");
        }

        setProducts(
          data.products.map((product: ProductApiItem) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            originalPrice: product.compareAtPrice ?? undefined,
            discountPercent: product.discountPct || undefined,
            images: product.images,
            vendorName: product.vendor?.shopName || "Fit Bazar",
            vendorSlug: product.vendor?.slug,
            rating: product.reviews?.length
              ? Number((product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1))
              : undefined,
            reviewCount: product._count?.reviews,
            soldCount: product.totalSold,
            sizes: product.sizes,
            isFestival: product.isFestivalSale,
            isSale: product.isYearRoundSale || product.discountPct > 0,
          })),
        );
        setTotal(data.total || 0);
        setFilters(data.filters || { categories: [], sizes: [], colors: [] });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, [searchParamsString]);

  const filterPanel = (
    <div className="h-full overflow-y-auto bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-semibold uppercase tracking-[2px] text-text-muted">{t("filters")}</div>
          <button
            type="button"
            onClick={() => {
              setSelectedSizes([]);
              setSelectedColors([]);
              setSelectedCategory("");
              setSelectedDiscount("");
              setMaxPrice(10000);
              router.replace("/products", { scroll: false });
            }}
            className="text-[12px] font-semibold text-fb-pink"
          >
            {t("clear_all")}
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="border-b border-border-light pb-5">
            <button type="button" className="flex w-full items-center justify-between text-left text-[13px] font-semibold uppercase text-text-primary">
              {t("categories")}
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </button>
            <div className="mt-3 space-y-2">
              {filters.categories.map((category) => (
                <label key={category} className="flex items-center gap-2 text-[13px] text-text-secondary">
                  <input
                    type="radio"
                    checked={selectedCategory === category}
                    onChange={() => {
                      setSelectedCategory(category);
                      updateParams({ category });
                    }}
                    className="h-4 w-4"
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          <div className="border-b border-border-light pb-5">
            <button type="button" className="flex w-full items-center justify-between text-left text-[13px] font-semibold uppercase text-text-primary">
              {t("price")}
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </button>
            <div className="mt-4">
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={maxPrice}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setMaxPrice(nextValue);
                  updateParams({ maxPrice: nextValue });
                }}
              />
              <p className="mt-2 text-[13px] text-text-secondary">NPR 500 — NPR {maxPrice.toLocaleString("en-NP")}</p>
            </div>
          </div>

          <div className="border-b border-border-light pb-5">
            <button type="button" className="flex w-full items-center justify-between text-left text-[13px] font-semibold uppercase text-text-primary">
              {t("size")}
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.sizes.map((size) => {
                const active = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      const nextSizes = active ? selectedSizes.filter((item) => item !== size) : [...selectedSizes, size];
                      setSelectedSizes(nextSizes);
                      updateParams({ sizes: nextSizes });
                    }}
                    className={`rounded-[20px] border px-3 py-1 text-[12px] ${active ? "border-fb-pink bg-fb-pink-bg text-fb-pink" : "border-border-default text-text-secondary"}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-border-light pb-5">
            <button type="button" className="flex w-full items-center justify-between text-left text-[13px] font-semibold uppercase text-text-primary">
              {t("color")}
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.colors.map((color) => {
                const active = selectedColors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => {
                      const nextColors = active ? selectedColors.filter((item) => item !== color) : [...selectedColors, color];
                      setSelectedColors(nextColors);
                      updateParams({ colors: nextColors });
                    }}
                    className={`rounded-[20px] border px-3 py-1 text-[12px] ${active ? "border-fb-pink bg-fb-pink-bg text-fb-pink" : "border-border-default text-text-secondary"}`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-border-light pb-5">
            <button type="button" className="flex w-full items-center justify-between text-left text-[13px] font-semibold uppercase text-text-primary">
              {t("discount")}
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              {discountOptions.map((discount) => (
                <button
                  key={discount.value}
                  type="button"
                  onClick={() => {
                    const nextValue = selectedDiscount === discount.value ? "" : discount.value;
                    setSelectedDiscount(nextValue);
                    updateParams({ minDiscount: nextValue });
                  }}
                  className={`rounded-[20px] border px-3 py-1 text-[12px] ${selectedDiscount === discount.value ? "border-fb-pink bg-fb-pink-bg text-fb-pink" : "border-border-default text-text-secondary"}`}
                >
                  {t(discount.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
    </div>
  );

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-4">
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] overflow-y-auto border-r border-border-light bg-card lg:block">
            {filterPanel}
          </aside>

          <section>
            <div className="mb-3 flex items-center justify-between rounded-[8px] bg-card px-4 py-3">
              <p className="text-[13px] text-text-muted">{t("showing_items", { count: String(total) })}</p>
              <div className="flex items-center gap-2 rounded-[4px] border border-border-default px-3 py-2 text-[13px] text-text-primary">
                <span className="text-text-muted">{t("sort_by")}:</span>
                <select
                  value={selectedSort}
                  onChange={(event) => {
                    setSelectedSort(event.target.value);
                    updateParams({ sort: event.target.value });
                  }}
                  className="border-none p-0"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-3 lg:grid-cols-4">
                <ProductGridSkeleton />
              </div>
            ) : products.length ? (
              <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[8px] bg-card px-4 py-16 text-center">
                <h2 className="text-[18px] font-semibold text-text-primary">{t("no_products_match_filters")}</h2>
                <p className="mt-2 text-[14px] text-text-muted">{t("try_clearing_filters")}</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-12 z-[990] flex gap-[1px] bg-border-light lg:hidden">
        <button type="button" onClick={() => setShowMobileFilter(true)} className="flex h-12 flex-1 items-center justify-center gap-2 bg-card text-[13px] font-semibold text-text-primary">
          <SlidersHorizontal className="h-4 w-4" />
          {t("filter")}
        </button>
        <button type="button" onClick={() => setShowMobileSort(true)} className="flex h-12 flex-1 items-center justify-center gap-2 bg-card text-[13px] font-semibold text-text-primary">
          <ChevronDown className="h-4 w-4" />
          {t("sort")}
        </button>
      </div>

      {showMobileFilter && (
        <div className="fixed inset-0 z-[1050] bg-black/30 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[78vh] rounded-t-[12px] bg-card">
            <div className="flex items-center justify-between border-b border-border-light p-4">
              <h3>{t("filters")}</h3>
              <button type="button" onClick={() => setShowMobileFilter(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}

      {showMobileSort && (
        <div className="fixed inset-0 z-[1050] bg-black/30 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-[12px] bg-card p-4">
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <h3>{t("sort_by")}</h3>
              <button type="button" onClick={() => setShowMobileSort(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="pt-3">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedSort(option.value);
                    updateParams({ sort: option.value });
                    setShowMobileSort(false);
                  }}
                  className={`block w-full py-3 text-left text-[14px] ${selectedSort === option.value ? "font-semibold text-fb-pink" : "text-text-secondary"}`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageInner />
    </Suspense>
  );
}
