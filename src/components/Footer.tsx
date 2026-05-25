"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Facebook, Instagram, Music2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { categoryQueryValue } from "@/lib/categories";

const groups = [
  {
    title: "online_shopping",
    links: [
      { label: "men", href: `/products?category=${encodeURIComponent(categoryQueryValue("Men"))}` },
      { label: "women", href: `/products?category=${encodeURIComponent(categoryQueryValue("Women"))}` },
      { label: "kids", href: `/products?category=${encodeURIComponent(categoryQueryValue("Kids"))}` },
      { label: "ethnic", href: `/products?category=${encodeURIComponent(categoryQueryValue("Ethnic"))}` },
      { label: "sportswear", href: `/products?category=${encodeURIComponent(categoryQueryValue("Sports"))}` },
    ],
  },
  {
    title: "customer_policy",
    links: [
      { label: "faq", href: "/help" },
      { label: "help_support", href: "/help" },
      { label: "returns", href: "/return-refund-policy" },
      { label: "terms", href: "/terms-conditions" },
      { label: "privacy", href: "/privacy-policy" },
    ],
  },
  {
    title: "about",
    links: [
      { label: "about_us", href: "/about-us" },
      { label: "contact", href: "/contact-us" },
      { label: "careers", href: "/careers" },
      { label: "press", href: "/press" },
      { label: "become_vendor", href: "/vendor/register" },
    ],
  },
];

export default function Footer() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useLanguage();

  return (
    <footer className="mt-8 bg-[#282C3F] pb-20 pt-10 text-white lg:pb-8">
      <div className="container">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 md:grid">
          <div>
            <Link href="/" className="text-[24px] font-bold tracking-tight text-white">
              fit<span className="text-fb-pink">bazar</span>
            </Link>
            <p className="mt-4 max-w-[260px] text-[14px] text-[#D7D9E0]">
              {t("footer_brand_blurb")}
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Instagram, Facebook, Music2].map((Icon, index) => (
                <span
                  key={index}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white"
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4 text-white" />
                </span>
              ))}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <h4 className="text-[13px] font-semibold tracking-[1px] text-white">{t(group.title)}</h4>
              <div className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <Link key={link.label} href={link.href} className="block text-[13px] text-[#D7D9E0]">
                    {t(link.label)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 md:hidden">
          <div>
            <Link href="/" className="text-[24px] font-bold tracking-tight text-white">
              fit<span className="text-fb-pink">bazar</span>
            </Link>
            <p className="mt-3 text-[14px] text-[#D7D9E0]">{t("footer_brand_short")}</p>
          </div>
          {groups.map((group, index) => {
            const open = openIndex === index;
            return (
              <div key={group.title} className="border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-[13px] font-semibold tracking-[1px] text-white">{t(group.title)}</span>
                  <ChevronDown className={`h-4 w-4 text-white transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="mt-3 space-y-3">
                    {group.links.map((link) => (
                      <Link key={link.label} href={link.href} className="block text-[13px] text-[#D7D9E0]">
                        {t(link.label)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-[13px] text-[#D7D9E0]">
          © 2026 Fit Bazar. {t("made_with_love")}
        </div>
      </div>
    </footer>
  );
}
