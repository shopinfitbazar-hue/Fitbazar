import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "AI Virtual Try-On for Nepali Fashion",
  description:
    "Explore FitBazar's upcoming AI virtual try-on experience for Nepali fashion, festive wear, colors, and outfit recommendations.",
  alternates: {
    canonical: canonicalUrl("/ai-try-on"),
  },
  openGraph: {
    url: canonicalUrl("/ai-try-on"),
    title: "AI Virtual Try-On for Nepali Fashion | FitBazar",
    description:
      "Explore FitBazar's upcoming AI virtual try-on experience for Nepali fashion, festive wear, colors, and outfit recommendations.",
  },
});

const studioHighlights = [
  {
    title: "Upload-ready styling",
    description:
      "We are shaping a cleaner virtual styling experience that starts with your own photo and adapts recommendations to color, silhouette, and occasion.",
  },
  {
    title: "Built for Nepali fashion",
    description:
      "The goal is to make local fits, fabrics, and festive wear feel genuinely useful, not like a generic tech demo pasted into a store.",
  },
  {
    title: "Launching carefully",
    description:
      "Instead of shipping an unreliable beta, we are keeping this feature polished behind the scenes until the results feel trustworthy for real customers.",
  },
];

export default function AiTryOnPage() {
  return (
    <main className="bg-page">
      <Header />

      <div className="container py-8">
        <section className="overflow-hidden rounded-[12px] bg-card shadow-[var(--shadow-sm)]">
          <div className="grid lg:grid-cols-[1fr_0.95fr]">
            <div className="p-8 md:p-10">
              <small className="text-[12px] font-semibold uppercase tracking-[1px] text-fb-pink">
                Style Studio
              </small>
              <h1 className="mt-3">A Better Virtual Try-On Experience Is on the Way</h1>
              <p className="mt-4 max-w-[560px] text-[15px] text-text-secondary">
                Fit Bazar is preparing a premium try-on experience that feels useful for real shopping, not like a rough demo.
                Until it is fully ready, we are focusing on fast browsing, better product detail, and smarter recommendations.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/products" className="btn-primary">
                  Shop Products
                </Link>
                <Link href="/discover" className="btn-ghost">
                  Explore Style Journal
                </Link>
              </div>
            </div>

            <div className="relative min-h-[280px] bg-[var(--bg-surface)]">
              <Image
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&auto=format&fit=crop"
                alt="Fit Bazar style studio preview"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          {studioHighlights.map((item) => (
            <div key={item.title} className="rounded-[12px] bg-card p-5 shadow-[var(--shadow-sm)]">
              <h2 className="text-[18px] font-semibold text-text-primary">{item.title}</h2>
              <p className="mt-2 text-[14px] text-text-secondary">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-[12px] bg-card p-6 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2>What You Can Use Right Now</h2>
              <p className="mt-1 text-[14px] text-text-muted">
                Everything below is live today and optimized for a smooth customer journey.
              </p>
            </div>
            <Link href="/search?q=kurta" className="text-[13px] font-semibold uppercase tracking-[0.6px] text-fb-pink">
              Search Trending Products
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[8px] border border-border-light p-5">
              <h3 className="text-[16px] font-semibold text-text-primary">Sharper product detail</h3>
              <p className="mt-2 text-[14px] text-text-secondary">
                Cleaner pricing, delivery checks, size selection, and related products are already available across the catalog.
              </p>
            </div>
            <div className="rounded-[8px] border border-border-light p-5">
              <h3 className="text-[16px] font-semibold text-text-primary">Smarter discovery</h3>
              <p className="mt-2 text-[14px] text-text-secondary">
                Use categories, filters, and search to narrow quickly by style, discount, color, and vendor.
              </p>
            </div>
            <div className="rounded-[8px] border border-border-light p-5">
              <h3 className="text-[16px] font-semibold text-text-primary">Reliable checkout flow</h3>
              <p className="mt-2 text-[14px] text-text-secondary">
                Cart, address selection, coupon validation, and order placement are ready for real customer use.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
