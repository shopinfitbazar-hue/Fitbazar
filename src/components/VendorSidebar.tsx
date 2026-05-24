"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

const sidebarLinks = [
  { key: "dashboard", href: "/vendor/dashboard", labelKey: "dashboard" },
  { key: "orders", href: "/vendor/orders", labelKey: "orders" },
  { key: "products", href: "/vendor/products", labelKey: "products" },
  { key: "payouts", href: "/vendor/payouts", labelKey: "payouts" },
  { key: "store-preview", href: "/vendor/store-preview", labelKey: "store_preview" },
  { key: "settings", href: "/vendor/settings", labelKey: "settings" },
];

type VendorSidebarProps = {
  shopName?: string;
  isApproved?: boolean;
  isSuspended?: boolean;
  subtitle?: string;
};

export default function VendorSidebar({
  shopName,
  isApproved,
  isSuspended,
  subtitle,
}: VendorSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="hidden min-h-[calc(100vh-60px)] w-60 shrink-0 border-r border-border-light bg-card lg:block">
      <div className="border-b border-border-light p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fb-pink-bg text-[20px] font-bold text-fb-pink">
          {shopName?.slice(0, 2).toUpperCase() || "VB"}
        </div>
        <div className="mt-3 text-[16px] font-semibold text-text-primary">
          {shopName || subtitle || t("vendor_workspace")}
        </div>
        <span className={`badge mt-2 ${isSuspended ? "badge-amber" : isApproved ? "badge-green" : "badge-orange"}`}>
          {isSuspended ? t("suspended") : isApproved ? t("verified_vendor") : t("pending_approval")}
        </span>
      </div>

      <nav className="py-3">
        {sidebarLinks.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex h-11 items-center px-4 text-[14px] ${
                active
                  ? "border-l-[3px] border-fb-pink bg-fb-pink-bg font-semibold text-fb-pink"
                  : "text-text-secondary hover:bg-[var(--bg-hover)]"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
