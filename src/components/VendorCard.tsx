"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getSafeImageUrl, FALLBACK_VENDOR_IMAGE } from "@/lib/media";
import SmartImage from "@/components/ui/SmartImage";

interface VendorCardProps {
  id: string;
  slug?: string;
  shopName: string;
  logo?: string;
  banner?: string;
  description?: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  isVerified?: boolean;
  location?: string;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function VendorCard({
  shopName,
  slug,
  logo,
  description,
  rating,
  location,
}: VendorCardProps) {
  const { t } = useLanguage();
  const vendorSlug = slug || slugify(shopName);

  return (
    <Link
      href={`/shop/${vendorSlug}`}
      className="block rounded-[24px] border border-white/70 bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-lg)]"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
        {logo ? (
          <SmartImage
            src={getSafeImageUrl(logo, FALLBACK_VENDOR_IMAGE)}
            alt={shopName}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[22px] font-bold text-fb-pink">{shopName.charAt(0)}</span>
        )}
      </div>
      <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.03em] text-text-primary">{shopName}</h3>
      <p className="mt-2 text-[13px] text-text-muted">{location || description || t("fashion_lifestyle")}</p>
      <div className="mt-4 flex items-center justify-center gap-1 text-[13px] text-text-secondary">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star key={index} className="h-3.5 w-3.5 fill-[#FFC94A] text-[#FFC94A]" />
        ))}
        <span>{rating.toFixed(1)}</span>
      </div>
      <span className="btn-ghost mt-5 inline-flex px-4 py-1.5 text-[12px]">{t("visit_shop")}</span>
    </Link>
  );
}
