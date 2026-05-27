import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/config/site";
import { getAllBlogPosts, getBlogPost, getCategoryTitle, getRelatedBlogPosts, blogPostingJsonLd } from "@/lib/blog";
import { mapProductToCard } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { publicProductVisibilityFilter } from "@/lib/public-storefront";
import { breadcrumbJsonLd, canonicalUrl, itemListJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NP", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function productKeywordFilters(keyword: string): Prisma.ProductWhereInput[] {
  const normalized = keyword.trim();
  const lower = normalized.toLowerCase();
  const tag = lower.replace(/\s+/g, "-");

  return [
    { name: { contains: normalized, mode: "insensitive" } },
    { description: { contains: normalized, mode: "insensitive" } },
    { category: { contains: normalized, mode: "insensitive" } },
    { tags: { hasSome: [lower, tag, normalized] } },
  ];
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

async function getRelatedProducts(keywords: string[]) {
  const terms = Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))).slice(0, 8);

  const where: Prisma.ProductWhereInput = {
    ...publicProductVisibilityFilter,
    ...(terms.length ? { OR: terms.flatMap(productKeywordFilters) } : {}),
  };

  return prisma.product.findMany({
    where,
    include: getProductInclude(),
    orderBy: [{ totalSold: "desc" }, { createdAt: "desc" }],
    take: 8,
  });
}

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return buildMetadata({
      title: "Blog Post Not Found",
      robots: {
        index: false,
        follow: true,
      },
    });
  }

  return buildMetadata({
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: {
      canonical: canonicalUrl(post.path),
    },
    openGraph: {
      type: "article",
      url: canonicalUrl(post.path),
      title: post.title,
      description: post.description,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: new Date(post.date).toISOString(),
      modifiedTime: new Date(post.updatedAt || post.date).toISOString(),
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const [relatedPosts, relatedProducts] = await Promise.all([
    Promise.resolve(getRelatedBlogPosts(post, 3)),
    getRelatedProducts([...post.productKeywords, ...post.tags]),
  ]);
  const productCards = relatedProducts.map(mapProductToCard);
  const categoryTitle = getCategoryTitle(post.category);
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Fashion Blog", path: "/blog" },
    { name: categoryTitle, path: `/blog/category/${post.category}` },
    { name: post.title, path: post.path },
  ];
  const collectionLinks = post.relatedCollections.map((slug) => ({
    slug,
    href: `/collections/${slug}`,
    label: slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  }));

  return (
    <main className="bg-page">
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbItems),
          blogPostingJsonLd(post),
          itemListJsonLd(
            productCards.map((product) => ({
              name: product.name,
              path: `/products/${product.slug || product.id}`,
              image: product.images[0],
            })),
            `Related products for ${post.title}`,
          ),
        ]}
      />
      <Header />
      <div className="container py-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
          {breadcrumbItems.map((item, index) => (
            <span key={`${item.name}-${index}`} className="flex items-center gap-2">
              {index < breadcrumbItems.length - 1 ? (
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

        <article className="rounded-[8px] bg-card shadow-[var(--shadow-sm)]">
          <header className="px-4 py-6 md:px-8 md:py-8">
            <Link href={`/blog/category/${post.category}`} className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fb-pink">
              {categoryTitle}
            </Link>
            <h1 className="mt-3 max-w-[980px] text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-text-primary md:text-[58px]">
              {post.title}
            </h1>
            <p className="mt-4 max-w-[800px] text-[16px] leading-7 text-text-secondary">{post.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
              <span>{post.author}</span>
              <span aria-hidden="true">/</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true">/</span>
              <span>{post.readingTime} min read</span>
            </div>
          </header>

          <div className="grid gap-6 border-t border-border-light px-4 py-6 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-[104px] lg:h-fit">
              {post.toc.length ? (
                <div className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4">
                  <h2 className="text-[15px] font-semibold text-text-primary">Table of Contents</h2>
                  <div className="mt-3 space-y-2">
                    {post.toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-[13px] leading-5 text-text-secondary hover:text-fb-pink ${item.level === 3 ? "pl-3" : ""}`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {collectionLinks.length ? (
                <div className="mt-4 rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4">
                  <h2 className="text-[15px] font-semibold text-text-primary">Shop This Topic</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {collectionLinks.map((link) => (
                      <Link
                        key={link.slug}
                        href={link.href}
                        className="rounded-[20px] border border-border-default px-3 py-1 text-[12px] font-medium text-text-secondary hover:border-fb-pink hover:text-fb-pink"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>

            <div
              className="blog-content max-w-[780px]"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          </div>
        </article>

        {productCards.length ? (
          <section className="section mt-6 rounded-[8px]">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2>Related Products</h2>
                <p className="mt-1 text-[13px] text-text-muted">Shop products connected to this FitBazar fashion guide.</p>
              </div>
              <Link href="/products" className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fb-pink">
                Browse all products
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-[1px] bg-page md:grid-cols-4">
              {productCards.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </section>
        ) : null}

        {relatedPosts.length ? (
          <section className="mt-6 rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
            <h2 className="text-[22px] font-semibold text-text-primary">Related Fashion Articles</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link key={related.slug} href={related.path} className="rounded-[8px] border border-border-light p-4 hover:border-fb-pink">
                  <p className="text-[12px] font-medium text-text-muted">{getCategoryTitle(related.category)}</p>
                  <h3 className="mt-2 text-[16px] font-semibold leading-snug text-text-primary">{related.title}</h3>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-text-secondary">{related.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <Footer />
    </main>
  );
}
