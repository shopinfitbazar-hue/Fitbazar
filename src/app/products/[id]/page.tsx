import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductDetailClient from "@/components/ProductDetailClient";
import JsonLd from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { mapProductToCard } from "@/lib/catalog";
import { publicProductVisibilityFilter } from "@/lib/public-storefront";
import { buildMetadata } from "@/config/site";
import { breadcrumbJsonLd, canonicalUrl, collectionPathForCategory, productJsonLd, productSeoDescription } from "@/lib/seo";

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
      slug: true,
      category: true,
      price: true,
      compareAtPrice: true,
      discountPct: true,
      stock: true,
      vendor: {
        select: {
          shopName: true,
          slug: true,
        },
      },
    },
  });

  if (!product) {
    return buildMetadata({
      title: "Product not found",
    });
  }

  const description = productSeoDescription(product);
  const title = `${product.name} in Nepal`;
  const url = canonicalUrl(`/products/${product.slug}`);
  const image = product.images[0];

  return buildMetadata({
    title,
    description,
    keywords: [
      product.name,
      `${product.name} Nepal`,
      `${product.category} Nepal`,
      "online fashion shopping Nepal",
      "FitBazar",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: image ? [{ url: image, alt: `${product.name} from ${product.vendor?.shopName || "FitBazar"}` }] : undefined,
    },
    twitter: {
      title,
      description,
      images: image ? [image] : undefined,
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
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: product.category, path: collectionPathForCategory(product.category) },
            { name: product.name, path: `/products/${product.slug}` },
          ]),
          productJsonLd({
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description,
            images: product.images,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            discountPct: product.discountPct,
            category: product.category,
            stock: product.stock,
            updatedAt: product.updatedAt,
            vendor: product.vendor,
            reviews: product.reviews,
            reviewCount: product._count.reviews,
          }),
        ]}
      />
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
