import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductDetailClient from "@/components/ProductDetailClient";
import { prisma } from "@/lib/prisma";
import { mapProductToCard } from "@/lib/catalog";
import { publicProductVisibilityFilter } from "@/lib/public-storefront";
import { buildMetadata } from "@/config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: {
      slug: id,
      ...publicProductVisibilityFilter,
    },
    select: {
      name: true,
      description: true,
      images: true,
    },
  });

  if (!product) {
    return buildMetadata({
      title: "Product not found",
    });
  }

  return buildMetadata({
    title: product.name,
    description: product.description || `Shop ${product.name} on Fit Bazzar.`,
    openGraph: {
      title: product.name,
      description: product.description || `Shop ${product.name} on Fit Bazzar.`,
      images: product.images[0] ? [{ url: product.images[0], alt: product.name }] : undefined,
    },
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: {
      slug: id,
      ...publicProductVisibilityFilter,
    },
    include: {
      vendor: {
        select: {
          id: true,
          shopName: true,
          slug: true,
          logo: true,
          category: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const [similarProducts, alsoBoughtProducts] = await Promise.all([
    prisma.product.findMany({
      where: {
        id: { not: product.id },
        ...publicProductVisibilityFilter,
        category: product.category,
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
    prisma.product.findMany({
      where: {
        id: { not: product.id },
        ...publicProductVisibilityFilter,
        vendorId: { not: product.vendorId },
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
  ]);

  return (
    <main className="bg-page">
      <Header />
      <ProductDetailClient
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description || "",
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          discountPct: product.discountPct,
          images: product.images,
          sizes: product.sizes,
          colors: product.colors,
          stock: product.stock,
          totalSold: product.totalSold,
          vendor: product.vendor,
          reviews: product.reviews.map((review) => ({
            ...review,
            createdAt: review.createdAt.toISOString(),
          })),
        }}
        similarProducts={similarProducts.map(mapProductToCard)}
        alsoBoughtProducts={alsoBoughtProducts.map(mapProductToCard)}
      />
      <Footer />
    </main>
  );
}
