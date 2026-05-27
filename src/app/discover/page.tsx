import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmartImage from "@/components/ui/SmartImage";
import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Nepal Fashion Trends and Style Guide",
  description:
    "Discover Nepali fashion trends, festive outfit ideas, styling notes, and curated shopping collections on FitBazar.",
  alternates: {
    canonical: canonicalUrl("/discover"),
  },
  openGraph: {
    url: canonicalUrl("/discover"),
    title: "Nepal Fashion Trends and Style Guide | FitBazar",
    description:
      "Discover Nepali fashion trends, festive outfit ideas, styling notes, and curated shopping collections on FitBazar.",
  },
});

const editorialCards = [
  {
    title: "Festive Dressing, Done Right",
    description: "Classic Nepali silhouettes, softer layering, and elevated accessories for weddings, Dashain, and family celebrations.",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&auto=format&fit=crop",
    href: "/collections/ethnic",
  },
  {
    title: "Everyday Layers for Kathmandu Weather",
    description: "Light jackets, textured knits, and versatile separates that work from cool mornings to late evenings.",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&auto=format&fit=crop",
    href: "/collections/sportswear",
  },
  {
    title: "Pashmina, Dhaka, and Handwoven Details",
    description: "Pieces that feel local, premium, and timeless enough to stay in rotation well beyond one season.",
    image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&auto=format&fit=crop",
    href: "/collections/sale",
  },
];

const styleNotes = [
  {
    title: "Occasion-first shopping",
    body: "Start with where you are going, then narrow by fabric, layering, and comfort. It prevents overbuying and makes outfit building faster.",
  },
  {
    title: "Color that travels well",
    body: "Rust, maroon, forest green, deep navy, and warm neutrals work beautifully across festive, office, and casual settings in Nepal.",
  },
  {
    title: "Invest in versatile hero pieces",
    body: "A strong shawl, a clean kurta, or a good jacket can anchor multiple looks. That is usually the smartest place to spend a little more.",
  },
];

export default function DiscoverPage() {
  return (
    <main className="bg-page">
      <Header />

      <div className="container py-8">
        <section className="overflow-hidden rounded-[12px] bg-card shadow-[var(--shadow-sm)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 md:p-10">
              <small className="text-[12px] font-semibold uppercase tracking-[1px] text-fb-pink">Style Journal</small>
              <h1 className="mt-3">Discover What Feels Current, Useful, and Worth Buying</h1>
              <p className="mt-4 max-w-[560px] text-[15px] text-text-secondary">
                A cleaner editorial space for inspiration, styling direction, and smarter shopping decisions across Nepali fashion, festive wear, and everyday essentials.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/products" className="btn-primary">
                  Explore Products
                </Link>
                <Link href="/search?q=kurta" className="btn-ghost">
                  Search Trends
                </Link>
              </div>
            </div>
            <div className="relative min-h-[280px] bg-[var(--bg-surface)]">
              <SmartImage
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1400&auto=format&fit=crop"
                alt="Fit Bazar discover editorial"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          {editorialCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="overflow-hidden rounded-[12px] bg-card shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <div className="relative aspect-[4/3] bg-[var(--bg-surface)]">
                <SmartImage src={card.image} alt={card.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <div className="p-5">
                <h2 className="text-[18px] font-semibold text-text-primary">{card.title}</h2>
                <p className="mt-2 text-[14px] text-text-secondary">{card.description}</p>
                <div className="mt-4 text-[13px] font-semibold uppercase tracking-[0.6px] text-fb-pink">Explore Story</div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-4 rounded-[12px] bg-card p-6 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2>Style Notes for Real Shopping</h2>
              <p className="mt-1 text-[14px] text-text-muted">
                Short, useful guidance built for customers who want fewer wrong purchases and better outfits.
              </p>
            </div>
            <Link href="/products" className="text-[13px] font-semibold uppercase tracking-[0.6px] text-fb-pink">
              Shop Now
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {styleNotes.map((note) => (
              <div key={note.title} className="rounded-[8px] border border-border-light p-5">
                <h3 className="text-[16px] font-semibold text-text-primary">{note.title}</h3>
                <p className="mt-2 text-[14px] text-text-secondary">{note.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
