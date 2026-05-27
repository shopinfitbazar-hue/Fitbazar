import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import BlogCard from "@/components/blog/BlogCard";
import { buildMetadata } from "@/config/site";
import { getBlogCategory, getBlogCategories, getPostsByCategory } from "@/lib/blog";
import { breadcrumbJsonLd, canonicalUrl, itemListJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return getBlogCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getBlogCategory(slug);

  if (!category) {
    return buildMetadata({
      title: "Blog Category Not Found",
      robots: {
        index: false,
        follow: true,
      },
    });
  }

  const path = `/blog/category/${category.slug}`;
  return buildMetadata({
    title: category.title,
    description: category.description,
    keywords: category.keywords,
    alternates: {
      canonical: canonicalUrl(path),
    },
    openGraph: {
      url: canonicalUrl(path),
      title: `${category.title} | FitBazar Blog`,
      description: category.description,
    },
    twitter: {
      title: `${category.title} | FitBazar Blog`,
      description: category.description,
    },
  });
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await params;
  const category = getBlogCategory(slug);

  if (!category) {
    notFound();
  }

  const posts = getPostsByCategory(category.slug);
  const otherCategories = getBlogCategories().filter((item) => item.slug !== category.slug);
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Fashion Blog", path: "/blog" },
    { name: category.title, path: `/blog/category/${category.slug}` },
  ];

  return (
    <main className="bg-page">
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbItems),
          itemListJsonLd(posts.map((post) => ({ name: post.title, path: post.path, image: post.image })), category.title),
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
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fb-pink">FitBazar Blog Category</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em] text-text-primary md:text-[52px]">
            {category.title}
          </h1>
          <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-text-secondary">{category.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {otherCategories.map((item) => (
              <Link
                key={item.slug}
                href={`/blog/category/${item.slug}`}
                className="rounded-[20px] border border-border-default px-3 py-1 text-[12px] font-medium text-text-secondary hover:border-fb-pink hover:text-fb-pink"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2>{category.title} Articles</h2>
              <p className="mt-1 text-[13px] text-text-muted">{posts.length} articles for Nepal shoppers.</p>
            </div>
            <Link href="/blog" className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fb-pink">
              All blog posts
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <BlogCard key={post.slug} post={post} priority={index === 0} />
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
