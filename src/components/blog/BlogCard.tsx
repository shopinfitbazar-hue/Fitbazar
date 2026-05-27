import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import type { BlogPost } from "@/lib/blog";
import { getCategoryTitle } from "@/lib/blog";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NP", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function BlogCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-[8px] border border-white/70 bg-card shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
      <Link href={post.path} className="block">
        <div className="relative aspect-[16/10] bg-[var(--bg-surface)]">
          <SmartImage
            src={post.image}
            alt={`${post.title} cover image`}
            fill
            priority={priority}
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
        <div className="p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-text-muted">
            <span>{getCategoryTitle(post.category)}</span>
            <span aria-hidden="true">/</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">/</span>
            <span>{post.readingTime} min read</span>
          </div>
          <h2 className="mt-3 line-clamp-2 text-[20px] font-semibold leading-tight tracking-[-0.03em] text-text-primary">
            {post.title}
          </h2>
          <p className="mt-3 line-clamp-2 text-[14px] leading-6 text-text-secondary">{post.excerpt}</p>
          <div className="mt-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-fb-pink">Read guide</div>
        </div>
      </Link>
    </article>
  );
}
