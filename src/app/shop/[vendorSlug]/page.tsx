import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import VendorReviewSection from "@/components/VendorReviewSection";
import JsonLd from "@/components/JsonLd";
import { unstable_cache } from "next/cache";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { mapProductToCard } from "@/lib/catalog";
import { PUBLIC_CATALOG_REVALIDATE_SECONDS } from "@/lib/public-catalog";
import { t, type Language } from "@/lib/translations";
import { publicProductVisibilityFilter, publicVendorVisibilityFilter } from "@/lib/public-storefront";
import { buildMetadata } from "@/config/site";
import { breadcrumbJsonLd, canonicalUrl, itemListJsonLd, truncateSeo } from "@/lib/seo";

export const revalidate = PUBLIC_CATALOG_REVALIDATE_SECONDS;

function buildStoreProductOrderBy(sort: string) {
  if (sort === "price_asc") return [{ price: "asc" as const }];
  if (sort === "price_desc") return [{ price: "desc" as const }];
  if (sort === "newest") return [{ createdAt: "desc" as const }];
  return [{ totalSold: "desc" as const }, { createdAt: "desc" as const }];
}

async function queryVendorStore(vendorSlug: string, category: string | undefined, sort: string) {
  const vendor = await prisma.vendor.findFirst({
    where: {
      slug: vendorSlug,
      ...publicVendorVisibilityFilter,
      isPartnered: true,
    },
    select: {
      id: true,
      shopName: true,
      slug: true,
      logo: true,
      description: true,
      category: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      reviews: {
        where: { isVisible: true },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      },
      _count: {
        select: {
          products: true,
          orders: true,
          reviews: true,
        },
      },
    },
  });

  if (!vendor) return null;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...publicProductVisibilityFilter,
        vendorId: vendor.id,
        ...(category ? { category } : {}),
      },
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            slug: true,
            logo: true,
            isPartnered: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: buildStoreProductOrderBy(sort),
      take: 48,
    }),
    prisma.product.findMany({
      where: {
        ...publicProductVisibilityFilter,
        vendorId: vendor.id,
      },
      select: {
        category: true,
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    }),
  ]);

  return {
    vendor,
    products,
    categories,
  };
}

function getCachedVendorStore(vendorSlug: string, category: string | undefined, sort: string) {
  return unstable_cache(
    () => queryVendorStore(vendorSlug, category, sort),
    ["public-vendor-store", vendorSlug, category || "all", sort],
    {
      revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
      tags: ["public-vendor-store"],
    },
  )();
}

function formatCachedDate(value: Date | string) {
  return typeof value === "string" ? value : value.toISOString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vendorSlug: string }> | { vendorSlug: string };
}) {
  const { vendorSlug } = await params;
  const data = await getCachedVendorStore(vendorSlug, undefined, "popular");
  const vendor = data?.vendor;

  if (!vendor) {
    return buildMetadata({
      title: "Store Not Found",
      robots: {
        index: false,
        follow: true,
      },
    });
  }

  const title = `${vendor.shopName} Store in Nepal`;
  const description = truncateSeo(
    vendor.description ||
      `Shop ${vendor.shopName} products on FitBazar. Browse ${vendor.category || "fashion"} from a trusted Nepal seller with mobile-friendly checkout.`,
  );
  const url = canonicalUrl(`/shop/${vendor.slug}`);

  return buildMetadata({
    title,
    description,
    keywords: [
      vendor.shopName,
      `${vendor.shopName} Nepal`,
      `${vendor.category || "fashion"} Nepal`,
      "Nepal fashion store",
      "FitBazar vendor",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      url,
      title,
      description,
      images: vendor.logo ? [{ url: vendor.logo, alt: `${vendor.shopName} logo` }] : undefined,
    },
    twitter: {
      title,
      description,
      images: vendor.logo ? [vendor.logo] : undefined,
    },
  });
}

export default async function VendorStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ vendorSlug: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { vendorSlug } = await params;
  const { category, sort = "popular" } = await searchParams;
  const lang = "en" as Language;
  const data = await getCachedVendorStore(vendorSlug, category, sort);
  const vendor = data?.vendor;

  if (!vendor || !data) {
    notFound();
  }
  const { products, categories } = data;

  const averageVendorRating = vendor.reviews.length
    ? (vendor.reviews.reduce((sum, review) => sum + review.rating, 0) / vendor.reviews.length).toFixed(1)
    : "0.0";

  return (
    <main className="bg-page">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shops", path: "/products" },
            { name: vendor.shopName, path: `/shop/${vendor.slug}` },
          ]),
          itemListJsonLd(
            products.slice(0, 24).map((product) => ({
              name: product.name,
              path: `/products/${product.slug}`,
              image: product.images[0],
            })),
            `${vendor.shopName} products`,
          ),
        ]}
      />
      <Header />
      <div className="container py-4">
        <section className="rounded-[8px] bg-card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border-light bg-fb-pink-bg text-[28px] font-bold text-fb-pink">
                {vendor.shopName.charAt(0)}
              </div>
              <div>
                <h1 className="text-[24px] font-bold text-text-primary">{vendor.shopName}</h1>
                <p className="mt-1 text-[14px] text-text-secondary">{vendor.description || t("vendor_store_default_blurb", lang)}</p>
                <div className="mt-2 flex items-center gap-2 text-[13px] text-text-secondary">
                  <Star className="h-4 w-4 fill-[#FFC94A] text-[#FFC94A]" />
                  <span>{averageVendorRating}</span>
                  <span>•</span>
                  <span>{vendor._count.products} {t("products", lang).toLowerCase()}</span>
                  <span>•</span>
                  <span>{vendor._count.reviews} {t("reviews", lang).toLowerCase()}</span>
                  <span>•</span>
                  <span>{vendor.category || "Nepal"}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="#products" className="btn-ghost">{t("browse_products", lang)}</Link>
            </div>
          </div>
        </section>

        <section id="products" className="section mt-4 rounded-[8px]">
          <div className="mb-4 flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <h2>{t("shop_all_products", lang)}</h2>
              <p className="mt-1 text-[13px] text-text-muted">{products.length} {t("items_from_store", lang)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/shop/${vendor.slug}`} className={`rounded-[20px] border px-3 py-1 text-[12px] ${!category ? "border-fb-pink bg-fb-pink-bg text-fb-pink" : "border-border-default text-text-secondary"}`}>{t("all", lang)}</Link>
              {categories.map((item) => (
                <a
                  key={item.category}
                  href={`/shop/${vendor.slug}?category=${encodeURIComponent(item.category)}`}
                  className={`rounded-[20px] border px-3 py-1 text-[12px] ${category === item.category ? "border-fb-pink bg-fb-pink-bg text-fb-pink" : "border-border-default text-text-secondary"}`}
                >
                  {item.category}
                </a>
              ))}
            </div>
          </div>

          {products.length ? (
            <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} {...mapProductToCard(product)} />
              ))}
            </div>
          ) : (
            <div className="px-4 pb-4 md:px-6">
              <div className="rounded-[8px] border border-border-light bg-card p-8 text-center">
                <h3>{t("no_products_found", lang)}</h3>
                <p className="mt-2 text-[14px] text-text-muted">{t("store_no_products_selected_category", lang)}</p>
              </div>
            </div>
          )}
        </section>

        <VendorReviewSection
          vendorId={vendor.id}
          initialReviews={vendor.reviews.map((review) => ({
            ...review,
            createdAt: formatCachedDate(review.createdAt),
          }))}
          initialAverageRating={Number(averageVendorRating)}
          initialReviewCount={vendor._count.reviews}
        />
      </div>
      <Footer />
    </main>
  );
}
