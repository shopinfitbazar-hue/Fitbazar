"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import VendorCard from "@/components/VendorCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { Search } from "lucide-react";
import { categoryQueryValue } from "@/lib/categories";
import { useLanguage } from "@/lib/LanguageContext";

interface SearchProduct {
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
  vendor?: {
    id: string;
    shopName: string;
    slug: string;
  };
}

interface SearchVendor {
  id: string;
  slug: string;
  shopName: string;
  logo?: string | null;
  category?: string | null;
}

interface SearchCategory {
  id: string;
  name: string;
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const q = searchParams?.get("q") || "";
  const [query, setQuery] = useState(q);
  const [tab, setTab] = useState<"products" | "vendors">("products");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [vendors, setVendors] = useState<SearchVendor[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    if (!q) {
      setProducts([]);
      setVendors([]);
      setCategories([]);
      setTotal(0);
      return;
    }

    const controller = new AbortController();

    async function runSearch() {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Search failed");
        }
        setProducts(data.products || []);
        setVendors(data.vendors || []);
        setCategories(data.categories || []);
        setTotal(data.total || 0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setProducts([]);
          setVendors([]);
          setCategories([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    }

    void runSearch();
    return () => controller.abort();
  }, [q]);

  const productCards = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.compareAtPrice ?? undefined,
        discountPercent: product.discountPct || undefined,
        images: product.images,
        vendorName: product.vendor?.shopName || "Fit Bazar",
        vendorSlug: product.vendor?.slug,
        sizes: product.sizes,
        isFestival: product.isFestivalSale,
        isSale: product.isYearRoundSale || product.discountPct > 0,
      })),
    [products],
  );

  const vendorCards = useMemo(
    () =>
      vendors.map((vendor) => ({
        id: vendor.id,
        slug: vendor.slug,
        shopName: vendor.shopName,
        logo: vendor.logo ?? undefined,
        category: vendor.category ?? undefined,
        rating: 4.8,
        reviewCount: 0,
        productCount: 0,
        location: vendor.category || "Nepal Fashion Store",
      })),
    [vendors],
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-4">
        <div className="rounded-[8px] bg-card p-4">
          <form onSubmit={onSubmit} className="flex items-center gap-3 rounded-[20px] border border-border-default bg-[var(--bg-surface)] px-4">
            <Search className="h-4 w-4 shrink-0 text-text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} className="min-w-0 flex-1 !border-none !bg-transparent !px-0 py-3 !shadow-none focus:!border-none focus:!shadow-none" />
          </form>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setTab("products")} className={`rounded-[20px] px-4 py-2 text-[13px] font-medium ${tab === "products" ? "bg-fb-pink text-white" : "bg-[var(--bg-surface)] text-text-secondary"}`}>
              {t("products")}
            </button>
            <button type="button" onClick={() => setTab("vendors")} className={`rounded-[20px] px-4 py-2 text-[13px] font-medium ${tab === "vendors" ? "bg-fb-pink text-white" : "bg-[var(--bg-surface)] text-text-secondary"}`}>
              {t("vendors")}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[8px] bg-card p-4">
          <p className="text-[13px] text-text-muted">
            Showing results for <span className="font-semibold text-text-primary">{q || "all products"}</span>
            {tab === "products" ? ` • ${total} items` : ` • ${vendorCards.length} shops`}
          </p>

          {categories.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => router.push(`/products?category=${encodeURIComponent(categoryQueryValue(category.name))}`)}
                  className="rounded-[20px] border border-border-default px-3 py-1 text-[12px] text-text-secondary hover:border-fb-pink hover:text-fb-pink"
                >
                  {category.name}
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <ProductGridSkeleton count={4} />
            </div>
          ) : tab === "products" ? (
            productCards.length ? (
              <div className="mt-4 grid grid-cols-2 gap-[1px] bg-page md:grid-cols-4">
                {productCards.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[8px] border border-border-light p-8 text-center">
                <h2 className="text-[18px] font-semibold text-text-primary">No results found</h2>
                <p className="mt-2 text-[14px] text-text-muted">Try another keyword or explore all products instead.</p>
              </div>
            )
          ) : vendorCards.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {vendorCards.map((vendor) => (
                <VendorCard key={vendor.id} {...vendor} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[8px] border border-border-light p-8 text-center">
              <h2 className="text-[18px] font-semibold text-text-primary">No shops found</h2>
              <p className="mt-2 text-[14px] text-text-muted">We couldn&apos;t find a vendor matching that search.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
