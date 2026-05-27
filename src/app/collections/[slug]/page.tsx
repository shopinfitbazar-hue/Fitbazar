import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import JsonLd from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { mapProductToCard } from "@/lib/catalog";
import { publicProductVisibilityFilter } from "@/lib/public-storefront";
import { categorySlug, normalizeCategory } from "@/lib/categories";
import { buildMetadata } from "@/config/site";
import type { Prisma } from "@prisma/client";
import {
  breadcrumbJsonLd,
  buildCollectionMetadata,
  collectionDefinitions,
  faqJsonLd,
  type FaqItem,
  getCollectionDefinition,
  itemListJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type CollectionDefinition = {
  slug: string;
  title: string;
  description: string;
  category?: string;
  minDiscount?: number;
  keywords?: readonly string[];
  matchAll?: readonly (readonly string[])[];
  relatedCollections?: readonly string[];
  faq?: readonly FaqItem[];
};

type ProductForCard = NonNullable<Awaited<ReturnType<typeof getCollectionProducts>>[number]>;

const defaultCollectionFaq: readonly FaqItem[] = [
  {
    question: "Can I shop this collection online in Nepal?",
    answer: "Yes. FitBazar collection pages are built for Nepal shoppers and link to product pages from trusted fashion sellers.",
  },
  {
    question: "Do collection pages include related products?",
    answer: "Yes. FitBazar shows collection products, related product suggestions, and internal links to nearby fashion categories.",
  },
];

function productKeywordFilters(keyword: string): Prisma.ProductWhereInput[] {
  const normalized = keyword.trim();
  const tag = normalized.toLowerCase().replace(/\s+/g, "-");

  return [
    { name: { contains: normalized, mode: "insensitive" } },
    { description: { contains: normalized, mode: "insensitive" } },
    { category: { contains: normalized, mode: "insensitive" } },
    { tags: { hasSome: [normalized.toLowerCase(), tag] } },
  ];
}

function buildCollectionWhere(definition: CollectionDefinition): Prisma.ProductWhereInput {
  const keywordGroups = definition.matchAll?.map((group) => ({
    OR: group.flatMap(productKeywordFilters),
  }));

  return {
    ...publicProductVisibilityFilter,
    ...(definition.category ? { category: definition.category } : {}),
    ...(definition.minDiscount ? { discountPct: { gte: definition.minDiscount } } : {}),
    ...(keywordGroups?.length ? { AND: keywordGroups } : {}),
  };
}

function getProductInclude() {
  return {
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
  } satisfies Prisma.ProductInclude;
}

async function getCollectionProducts(definition: CollectionDefinition) {
  return prisma.product.findMany({
    where: buildCollectionWhere(definition),
    include: getProductInclude(),
    orderBy: definition.minDiscount
      ? [{ discountPct: "desc" }, { totalSold: "desc" }, { createdAt: "desc" }]
      : [{ totalSold: "desc" }, { createdAt: "desc" }],
    take: 48,
  });
}

async function getRelatedProducts(definition: CollectionDefinition, products: ProductForCard[]) {
  return prisma.product.findMany({
    where: {
      ...publicProductVisibilityFilter,
      id: products.length ? { notIn: products.map((product) => product.id) } : undefined,
      ...(definition.category ? { category: { not: definition.category } } : {}),
    },
    include: getProductInclude(),
    orderBy: [{ totalSold: "desc" }, { createdAt: "desc" }],
    take: 8,
  });
}

async function resolveCollection(slug: string): Promise<CollectionDefinition | null> {
  const known = getCollectionDefinition(slug);
  if (known) return known;

  const categories = await prisma.category.findMany({
    select: {
      name: true,
      slug: true,
    },
    take: 100,
  });
  const category = categories.find((item) => item.slug === slug || categorySlug(item.name) === slug);
  if (!category) return null;

  const name = normalizeCategory(category.name);
  return {
    slug: category.slug || categorySlug(name),
    category: name,
    title: `${name} Fashion in Nepal`,
    description: `Shop ${name.toLowerCase()} online in Nepal from trusted FitBazar fashion stores with mobile-friendly discovery and checkout.`,
    keywords: [`${name} Nepal`, `${name} online shopping Nepal`, "fashion marketplace Nepal"],
    faq: defaultCollectionFaq,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const definition = await resolveCollection(slug);

  if (!definition) {
    return buildMetadata({
      title: "Collection Not Found",
      robots: {
        index: false,
        follow: true,
      },
    });
  }

  return buildMetadata(buildCollectionMetadata(definition));
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await params;
  const definition = await resolveCollection(slug);

  if (!definition) {
    notFound();
  }

  const products = await getCollectionProducts(definition);
  const relatedProducts = await getRelatedProducts(definition, products);
  const productCards = products.map(mapProductToCard);
  const relatedProductCards = relatedProducts.map(mapProductToCard);
  const canonicalPath = `/collections/${definition.slug}`;
  const allCollections = Object.values(collectionDefinitions);
  const relatedCollectionSlugs = definition.relatedCollections ?? ["mens-fashion-nepal", "womens-fashion-nepal", "streetwear-nepal", "hoodies-nepal", "sale"];
  const relatedCollections = relatedCollectionSlugs
    .map((relatedSlug) => allCollections.find((collection) => collection.slug === relatedSlug))
    .filter((collection): collection is (typeof allCollections)[number] => collection !== undefined)
    .filter((collection) => collection.slug !== definition.slug);
  const fallbackCollections = allCollections.filter(
    (collection) => collection.slug !== definition.slug && !relatedCollections.some((related) => related.slug === collection.slug),
  );
  const internalCollections = [...relatedCollections, ...fallbackCollections].slice(0, 8);
  const faqs = definition.faq?.length ? definition.faq : defaultCollectionFaq;
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/products" },
    { name: definition.title, path: canonicalPath },
  ];

  return (
    <main className="bg-page">
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbItems),
          itemListJsonLd(
            productCards.slice(0, 24).map((product) => ({
              name: product.name,
              path: `/products/${product.slug || product.id}`,
              image: product.images[0],
            })),
            definition.title,
          ),
          faqJsonLd(faqs),
        ]}
      />
      <Header />
      <div className="container py-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
          {breadcrumbItems.map((item, index) => (
            <span key={item.name} className="flex items-center gap-2">
              {item.path && index < breadcrumbItems.length - 1 ? (
                <Link href={item.path} className="hover:text-fb-pink">
                  {item.name}
                </Link>
              ) : (
                <span className="text-text-primary">{item.name}</span>
              )}
              {index < breadcrumbItems.length - 1 ? <span>/</span> : null}
            </span>
          ))}
        </nav>

        <section className="rounded-[8px] bg-card px-4 py-6 shadow-[var(--shadow-sm)] md:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fb-pink">FitBazar Collection</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-text-primary md:text-[44px]">
            {definition.title}
          </h1>
          <p className="mt-3 max-w-[760px] text-[15px] leading-7 text-text-secondary">{definition.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {internalCollections.slice(0, 7).map((collection) => (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="rounded-[20px] border border-border-default px-3 py-1 text-[12px] font-medium text-text-secondary hover:border-fb-pink hover:text-fb-pink"
              >
                {collection.title.replace(" in Nepal", "")}
              </Link>
            ))}
          </div>
        </section>

        <section className="section mt-4 rounded-[8px]">
          <div className="mb-4 flex flex-col gap-2 px-4 md:flex-row md:items-end md:justify-between md:px-6">
            <div>
              <h2>Shop {definition.title.replace(" in Nepal", "").replace(" Nepal", "")} Products</h2>
              <p className="mt-1 text-[13px] text-text-muted">
                {products.length} items available from trusted Nepal fashion stores.
              </p>
            </div>
            <Link href={`/products${definition.category ? `?category=${encodeURIComponent(definition.category)}` : "?minDiscount=20&sort=discount"}`} className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fb-pink">
              Filter collection
            </Link>
          </div>

          {productCards.length ? (
            <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-3 lg:grid-cols-4">
              {productCards.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="px-4 pb-4 md:px-6">
              <div className="rounded-[8px] border border-border-light bg-card p-8 text-center">
                <h2 className="text-[18px] font-semibold text-text-primary">No products found</h2>
                <p className="mt-2 text-[14px] text-text-muted">Explore all fashion products while this collection is updated.</p>
                <Link href="/products" className="btn-primary mt-5 inline-flex">
                  Browse all products
                </Link>
              </div>
            </div>
          )}
        </section>

        {relatedProductCards.length ? (
          <section className="section mt-4 rounded-[8px]">
            <div className="mb-4 px-4 md:px-6">
              <h2>Related Products</h2>
              <p className="mt-1 text-[13px] text-text-muted">
                More fashion picks that help shoppers compare styles, prices, and stores across FitBazar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-4">
              {relatedProductCards.map((product) => (
                <ProductCard key={`related-${product.id}`} {...product} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-4 rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
          <h2 className="text-[20px] font-semibold text-text-primary">Related Fashion Collections in Nepal</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {internalCollections.map((collection) => (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="rounded-[20px] border border-border-default px-3 py-1 text-[12px] font-medium text-text-secondary hover:border-fb-pink hover:text-fb-pink"
              >
                {collection.title}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[14px] leading-6 text-text-secondary">
            FitBazar helps shoppers discover Nepal-first fashion across trusted partner stores, clear product pages, rich product photos, reviews, and mobile-friendly checkout.
          </p>
        </section>

        <section className="mt-4 rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
          <h2 className="text-[20px] font-semibold text-text-primary">FAQs About {definition.title}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-[8px] border border-border-light p-4">
                <h3 className="text-[15px] font-semibold text-text-primary">{faq.question}</h3>
                <p className="mt-2 text-[14px] leading-6 text-text-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
