import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import BlogCard from "@/components/blog/BlogCard";
import { buildMetadata } from "@/config/site";
import { blogIndexJsonLd, getAllBlogPosts, getBlogCategories } from "@/lib/blog";
import { breadcrumbJsonLd, canonicalUrl, itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Fashion Blog Nepal",
  description:
    "Read FitBazar fashion blogs for Nepal shoppers, including men's fashion, women's fashion, streetwear, oversized t-shirts, hoodies, ethnic wear, and shopping guides.",
  keywords: [
    "fashion blog Nepal",
    "Nepal fashion tips",
    "mens fashion Nepal blog",
    "womens fashion Nepal blog",
    "streetwear Nepal blog",
  ],
  alternates: {
    canonical: canonicalUrl("/blog"),
  },
  openGraph: {
    url: canonicalUrl("/blog"),
    title: "Fashion Blog Nepal | FitBazar",
    description: "Fashion guides, styling ideas, and online shopping advice for Nepal shoppers.",
  },
  twitter: {
    title: "Fashion Blog Nepal | FitBazar",
    description: "Fashion guides, styling ideas, and online shopping advice for Nepal shoppers.",
  },
});

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const categories = getBlogCategories();
  const featured = posts[0];
  const latest = posts.slice(1);
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Fashion Blog", path: "/blog" },
  ];

  return (
    <main className="bg-page">
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbItems),
          blogIndexJsonLd(posts),
          itemListJsonLd(posts.map((post) => ({ name: post.title, path: post.path, image: post.image })), "FitBazar Fashion Blog"),
        ]}
      />
      <Header />
      <div className="container py-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
          {breadcrumbItems.map((item, index) => (
            <span key={item.name} className="flex items-center gap-2">
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

        <section className="rounded-[8px] bg-card px-4 py-6 shadow-[var(--shadow-sm)] md:px-6 md:py-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fb-pink">FitBazar Editorial</p>
          <h1 className="mt-2 max-w-[920px] text-[34px] font-semibold tracking-[-0.04em] text-text-primary md:text-[56px]">
            Fashion Blog Nepal
          </h1>
          <p className="mt-4 max-w-[780px] text-[15px] leading-7 text-text-secondary">
            Style guides, trend-led outfit ideas, and online shopping advice for FitBazar customers looking for men&apos;s fashion, women&apos;s fashion, streetwear, hoodies, ethnic wear, and everyday clothing in Nepal.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/blog/category/${category.slug}`}
                className="rounded-[20px] border border-border-default px-3 py-1 text-[12px] font-medium text-text-secondary hover:border-fb-pink hover:text-fb-pink"
              >
                {category.title}
              </Link>
            ))}
          </div>
        </section>

        {featured ? (
          <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <BlogCard post={featured} priority />
            <aside className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
              <h2 className="text-[22px] font-semibold text-text-primary">Popular Fashion Topics</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Men\u0027s fashion in Nepal", href: "/collections/mens-fashion-nepal" },
                  { label: "Women\u0027s fashion in Nepal", href: "/collections/womens-fashion-nepal" },
                  { label: "Oversized t-shirts Nepal", href: "/collections/oversized-tshirts-nepal" },
                  { label: "Streetwear Nepal", href: "/collections/streetwear-nepal" },
                  { label: "Hoodies Nepal", href: "/collections/hoodies-nepal" },
                  { label: "Ethnic wear Nepal", href: "/collections/ethnic" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-[8px] border border-border-light px-4 py-3 text-[14px] font-medium text-text-secondary hover:border-fb-pink hover:text-fb-pink"
                  >
                    {link.label}
                    <span aria-hidden="true">/</span>
                  </Link>
                ))}
              </div>
            </aside>
          </section>
        ) : null}

        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2>Latest Fashion Guides</h2>
              <p className="mt-1 text-[13px] text-text-muted">SEO-focused articles built for Nepal fashion discovery and internal shopping paths.</p>
            </div>
            <Link href="/products" className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fb-pink">
              Shop products
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
