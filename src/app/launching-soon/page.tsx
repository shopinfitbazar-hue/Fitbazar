import Link from "next/link";
import { BarChart3, CheckCircle2, Grid3X3, Home, PackageCheck, ShieldCheck, ShoppingBag, Smartphone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LaunchingSoonPromo from "@/components/LaunchingSoonPromo";
import { buildMetadata } from "@/config/site";

export const metadata = buildMetadata({
  title: "Launching Soon - India to Nepal Delivery",
  description:
    "Fit Bazar is preparing India to Nepal delivery with trusted sourcing, clear updates, secure payments, and mobile-first shopping.",
  alternates: {
    canonical: "/launching-soon",
  },
});

const previewRows = [
  {
    label: "Android App",
    icon: Smartphone,
    screens: [
      { title: "Home", icon: Home, tone: "bg-[#f8efe5]" },
      { title: "Category", icon: Grid3X3, tone: "bg-[#eef4f8]" },
      { title: "Product", icon: ShoppingBag, tone: "bg-[#fff6e4]" },
      { title: "Cart", icon: ShoppingBag, tone: "bg-[#f4eef8]" },
      { title: "Checkout", icon: ShieldCheck, tone: "bg-[#eef8f3]" },
      { title: "Success", icon: PackageCheck, tone: "bg-[#edf7f3]" },
    ],
  },
  {
    label: "iOS App",
    icon: Smartphone,
    screens: [
      { title: "Launch", icon: CheckCircle2, tone: "bg-[#fff6e4]" },
      { title: "Orders", icon: PackageCheck, tone: "bg-[#eef4f8]" },
      { title: "Vendor", icon: BarChart3, tone: "bg-[#f8efe5]" },
      { title: "Admin", icon: ShieldCheck, tone: "bg-[#f4eef8]" },
      { title: "Search", icon: Grid3X3, tone: "bg-[#eef8f3]" },
      { title: "Bag", icon: ShoppingBag, tone: "bg-[#fff6e4]" },
    ],
  },
];

const steps = [
  "Tell us what you want from India",
  "Fit Bazar confirms sourcing, price, and delivery estimate",
  "Track the order from pickup to Nepal delivery",
];

export default function LaunchingSoonPage() {
  return (
    <main className="bg-page">
      <Header />
      <div className="container py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fb-pink">Fit Bazar Launch</p>
            <h1 className="mt-2 max-w-[780px] text-[2.1rem] leading-[0.98] md:text-[3.2rem]">
              Premium style, trusted quality, delivered to Nepal
            </h1>
          </div>
          <Link href="/products" className="btn-ghost">
            Shop now
          </Link>
        </div>

        <LaunchingSoonPromo mode="page" />

        <section className="section mt-6">
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-[24px] border border-white/70 bg-card p-5 shadow-[var(--shadow-card)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fb-pink">How it works</p>
              <h2 className="mt-2 text-[1.55rem] leading-tight">Simple flow from request to doorstep</h2>
              <div className="mt-5 space-y-3">
                {steps.map((step, index) => (
                  <div key={step} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-[13px] font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-[14px] leading-6 text-text-secondary">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fb-pink">Mobile previews</p>
                  <h2 className="mt-2 text-[1.55rem] leading-tight">Android and iOS ready shopping flow</h2>
                </div>
                <span className="rounded-full bg-[#111827] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                  App style web
                </span>
              </div>

              <div className="space-y-5">
                {previewRows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#111827] px-3 py-1.5 text-[12px] font-semibold text-white">
                      <row.icon className="h-4 w-4 text-[#d7a864]" />
                      {row.label}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                      {row.screens.map((screen) => (
                        <div
                          key={`${row.label}-${screen.title}`}
                          className="rounded-[22px] border border-border-light bg-white p-2 shadow-[0_14px_34px_rgba(16,24,39,0.08)]"
                        >
                          <div className={`rounded-[17px] ${screen.tone} p-3`}>
                            <div className="flex items-center justify-between">
                              <span className="h-1.5 w-8 rounded-full bg-[#111827]/25" />
                              <span className="h-2 w-2 rounded-full bg-[#111827]/35" />
                            </div>
                            <div className="mt-6 flex h-16 items-center justify-center rounded-[14px] bg-white/82">
                              <screen.icon className="h-8 w-8 text-[#111827]" strokeWidth={1.7} />
                            </div>
                            <p className="mt-4 truncate text-center text-[12px] font-semibold text-[#111827]">{screen.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
