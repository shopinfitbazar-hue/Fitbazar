import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePageClient from "@/components/HomePageClient";
import { prisma } from "@/lib/prisma";
import { mapProductToCard, mapVendorToCard } from "@/lib/catalog";
import { getSafeImageUrl, FALLBACK_BANNER_IMAGE } from "@/lib/media";
import { ProductStatus } from "@prisma/client";
import { buildMetadata } from "@/config/site";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Fit Bazzar | Premium Fashion Marketplace in Nepal",
  description:
    "Browse premium Nepal-first fashion, curated storefronts, and fast mobile shopping across Fit Bazzar.",
});

export default async function HomePage() {
  const [banners, categories, mostPopular, festivalConfig, yearRoundProducts, specialDiscounts, topShopVendors, partneredVendors] = await Promise.all([
    prisma.banner.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 8,
    }),
    prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        vendor: {
          isApproved: true,
          isSuspended: false,
          isPartnered: true,
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            slug: true,
            logo: true,
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
      orderBy: [{ totalSold: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.festivalConfig.findFirst({
      where: { isActive: true },
    }),
    prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        isYearRoundSale: true,
        vendor: {
          isApproved: true,
          isSuspended: false,
          isPartnered: true,
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            slug: true,
            logo: true,
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
      orderBy: [{ discountPct: "desc" }, { totalSold: "desc" }],
      take: 8,
    }),
    prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        discountPct: { gte: 20 },
        vendor: {
          isApproved: true,
          isSuspended: false,
          isPartnered: true,
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            slug: true,
            logo: true,
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
      orderBy: [{ discountPct: "desc" }, { totalSold: "desc" }],
      take: 8,
    }),
    prisma.vendor.findMany({
      where: {
        isApproved: true,
        isSuspended: false,
        isPartnered: true,
        isTopShop: true,
      },
      include: {
        reviews: {
          where: { isVisible: true },
          select: { rating: true },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 4,
    }),
    prisma.vendor.findMany({
      where: {
        isApproved: true,
        isSuspended: false,
        isPartnered: true,
      },
      include: {
        reviews: {
          where: { isVisible: true },
          select: { rating: true },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 4,
    }),
  ]);

  const festivalProducts = festivalConfig
    ? await prisma.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
          isFestivalSale: true,
          vendor: {
          isApproved: true,
          isSuspended: false,
          isPartnered: true,
        },
        },
        include: {
          vendor: {
            select: {
              id: true,
              shopName: true,
              slug: true,
              logo: true,
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
        orderBy: [{ totalSold: "desc" }, { createdAt: "desc" }],
        take: 8,
      })
    : [];

  const vendors = (topShopVendors.length ? topShopVendors : partneredVendors).slice(0, 4);

  return (
    <main className="bg-page">
      <Header />
      <HomePageClient
        banners={banners.map((banner) => ({
          id: banner.id,
          imageUrl: getSafeImageUrl(banner.imageUrl, FALLBACK_BANNER_IMAGE),
          title: banner.title,
          linkUrl: banner.linkUrl,
        }))}
        categories={categories}
        mostPopular={mostPopular.map(mapProductToCard)}
        festivalProducts={festivalProducts.map(mapProductToCard)}
        yearRoundProducts={yearRoundProducts.map(mapProductToCard)}
        specialDiscounts={specialDiscounts.map(mapProductToCard)}
        vendors={vendors.map(mapVendorToCard)}
        festival={
          festivalConfig
            ? {
                name: festivalConfig.name,
                nameNp: festivalConfig.nameNp,
                endDate: festivalConfig.endDate.toISOString(),
                isActive: festivalConfig.isActive,
              }
            : null
        }
      />
      <Footer />
    </main>
  );
}
