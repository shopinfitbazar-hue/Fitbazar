import Link from "next/link";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  actionHref,
  actionLabel = "View All",
}: SectionHeadingProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-muted">{eyebrow}</p> : null}
        <h2 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.03em] text-text-primary">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-[48rem] text-[0.95rem] text-text-secondary">{subtitle}</p> : null}
      </div>
      {actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-text-primary transition-transform duration-200 hover:-translate-y-0.5 hover:text-fb-pink"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
