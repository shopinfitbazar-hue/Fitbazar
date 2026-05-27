import "server-only";

import { cache } from "react";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { siteConfig } from "@/config/site";
import { absoluteUrl, canonicalUrl, truncateSeo } from "@/lib/seo";

export type BlogCategory = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
};

export type BlogFrontmatter = {
  title: string;
  description: string;
  category: string;
  date: string;
  updatedAt?: string;
  author: string;
  image: string;
  tags: string[];
  relatedCollections: string[];
  productKeywords: string[];
};

export type TableOfContentsItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type BlogPost = BlogFrontmatter & {
  slug: string;
  path: string;
  readingTime: number;
  excerpt: string;
  content: string;
  html: string;
  toc: TableOfContentsItem[];
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export const blogCategories: BlogCategory[] = [
  {
    slug: "fashion-trends",
    title: "Fashion Trends Nepal",
    description: "Fresh fashion trends, outfit ideas, and style inspiration for Nepal shoppers.",
    keywords: ["fashion trends Nepal", "Nepal fashion blog", "online fashion Nepal"],
  },
  {
    slug: "mens-fashion",
    title: "Men's Fashion Nepal",
    description: "Menswear guides for t-shirts, shirts, hoodies, footwear, streetwear, and everyday outfits.",
    keywords: ["mens fashion Nepal", "men clothing online Nepal", "men style Nepal"],
  },
  {
    slug: "womens-fashion",
    title: "Women's Fashion Nepal",
    description: "Women's fashion ideas for everyday wear, festive outfits, footwear, and accessories in Nepal.",
    keywords: ["womens fashion Nepal", "ladies fashion Nepal", "women clothing online Nepal"],
  },
  {
    slug: "streetwear",
    title: "Streetwear Nepal",
    description: "Streetwear styling guides for oversized t-shirts, hoodies, cargos, sneakers, and urban fashion.",
    keywords: ["streetwear Nepal", "urban fashion Nepal", "street style Nepal"],
  },
  {
    slug: "shopping-guides",
    title: "Shopping Guides",
    description: "Practical fashion buying guides for better online shopping decisions in Nepal.",
    keywords: ["fashion shopping guide Nepal", "online clothing guide Nepal", "FitBazar guide"],
  },
  {
    slug: "ethnic-wear",
    title: "Ethnic Wear Nepal",
    description: "Traditional, festive, and ethnic wear guides for Nepali celebrations and family events.",
    keywords: ["ethnic wear Nepal", "festival outfits Nepal", "kurta set Nepal"],
  },
];

const defaultFrontmatter: BlogFrontmatter = {
  title: "",
  description: "",
  category: "fashion-trends",
  date: "2026-05-27",
  author: "FitBazar Editorial",
  image: siteConfig.ogImage,
  tags: [],
  relatedCollections: [],
  productKeywords: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripMarkdown(value: string) {
  return value
    .replace(/^---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseListValue(lines: string[], startIndex: number) {
  const items: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length) {
    const line = lines[index];
    if (/^\s+-\s+/.test(line)) {
      items.push(line.replace(/^\s+-\s+/, "").trim());
      index += 1;
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    break;
  }

  return { items, nextIndex: index - 1 };
}

function parseFrontmatter(markdown: string): { frontmatter: BlogFrontmatter; content: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: defaultFrontmatter, content: markdown };
  }

  const frontmatter = { ...defaultFrontmatter };
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyMatch) continue;

    const key = keyMatch[1] as keyof BlogFrontmatter;
    let value = keyMatch[2]?.trim() ?? "";

    if (value === "") {
      const parsed = parseListValue(lines, index);
      if (Array.isArray(frontmatter[key])) {
        (frontmatter[key] as string[]) = parsed.items;
      }
      index = parsed.nextIndex;
      continue;
    }

    value = value.replace(/^["']|["']$/g, "");

    if (key === "tags" || key === "relatedCollections" || key === "productKeywords") {
      (frontmatter[key] as string[]) = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (key in frontmatter) {
      (frontmatter[key] as string) = value;
    }
  }

  return { frontmatter, content: match[2].trim() };
}

function renderInline(markdown: string) {
  const escaped = escapeHtml(markdown);
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/!\[([^\]]*)]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, (_match, label: string, href: string) => {
      const safeHref = href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://") || href.startsWith("#")
        ? href
        : "#";
      return `<a href="${escapeHtml(safeHref)}">${label}</a>`;
    });
}

function closeList(html: string[], listType: "ul" | "ol" | null) {
  if (!listType) return null;
  html.push(`</${listType}>`);
  return null;
}

export function renderMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  const toc: TableOfContentsItem[] = [];
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushParagraph();
      listType = closeList(html, listType);
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      listType = closeList(html, listType);
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      listType = closeList(html, listType);
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugify(text);
      if (level === 2 || level === 3) {
        toc.push({ id, text, level });
      }
      html.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      return;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      listType = closeList(html, listType);
      html.push(`<blockquote>${renderInline(line.replace(/^>\s+/, ""))}</blockquote>`);
      return;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType !== "ul") {
        listType = closeList(html, listType);
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${renderInline(unordered[1])}</li>`);
      return;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== "ol") {
        listType = closeList(html, listType);
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${renderInline(ordered[1])}</li>`);
      return;
    }

    listType = closeList(html, listType);
    paragraph.push(line.trim());
  });

  flushParagraph();
  closeList(html, listType);

  return {
    html: html.join("\n"),
    toc,
  };
}

function getReadingTime(content: string) {
  const words = stripMarkdown(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function readBlogPost(fileName: string): BlogPost | null {
  if (!fileName.endsWith(".md")) return null;
  const fullPath = path.join(BLOG_DIR, fileName);
  const markdown = readFileSync(fullPath, "utf8");
  const { frontmatter, content } = parseFrontmatter(markdown);
  const slug = fileName.replace(/\.md$/, "");
  const rendered = renderMarkdown(content);
  const excerpt = truncateSeo(frontmatter.description || stripMarkdown(content), 180);

  if (!frontmatter.title || !frontmatter.description) return null;

  return {
    ...frontmatter,
    slug,
    path: `/blog/${slug}`,
    readingTime: getReadingTime(content),
    excerpt,
    content,
    html: rendered.html,
    toc: rendered.toc,
  };
}

export const getAllBlogPosts = cache(() => {
  if (!existsSync(BLOG_DIR)) return [];

  return readdirSync(BLOG_DIR)
    .map(readBlogPost)
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

export const getBlogPost = cache((slug: string) => {
  return getAllBlogPosts().find((post) => post.slug === slug) ?? null;
});

export function getBlogCategories() {
  const posts = getAllBlogPosts();
  return blogCategories
    .map((category) => ({
      ...category,
      count: posts.filter((post) => post.category === category.slug).length,
    }))
    .filter((category) => category.count > 0);
}

export function getBlogCategory(slug: string) {
  return getBlogCategories().find((category) => category.slug === slug) ?? null;
}

export function getPostsByCategory(slug: string) {
  return getAllBlogPosts().filter((post) => post.category === slug);
}

export function getRelatedBlogPosts(post: BlogPost, limit = 3) {
  const tagSet = new Set(post.tags.map((tag) => tag.toLowerCase()));

  return getAllBlogPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      const tagMatches = candidate.tags.filter((tag) => tagSet.has(tag.toLowerCase())).length;
      const categoryMatch = candidate.category === post.category ? 2 : 0;
      return {
        post: candidate,
        score: tagMatches + categoryMatch,
      };
    })
    .sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime())
    .slice(0, limit)
    .map((item) => item.post);
}

export function getCategoryTitle(slug: string) {
  return blogCategories.find((category) => category.slug === slug)?.title ?? "Fashion Blog";
}

export function blogPostingJsonLd(post: BlogPost) {
  const url = canonicalUrl(post.path);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    headline: post.title,
    description: post.description,
    image: absoluteUrl(post.image || siteConfig.ogImage),
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.updatedAt || post.date).toISOString(),
    author: {
      "@type": "Organization",
      name: post.author,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteConfig.icon),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: getCategoryTitle(post.category),
    keywords: post.tags.join(", "),
    wordCount: stripMarkdown(post.content).split(/\s+/).filter(Boolean).length,
  };
}

export function blogIndexJsonLd(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "FitBazar Fashion Blog",
    description: "Fashion guides, trend reports, and shopping advice for Nepal shoppers.",
    url: canonicalUrl("/blog"),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    blogPost: posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: canonicalUrl(post.path),
      datePublished: new Date(post.date).toISOString(),
    })),
  };
}
