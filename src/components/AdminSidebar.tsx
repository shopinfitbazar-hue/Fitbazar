"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const navItems = [
  { id: "dashboard", labelKey: "dashboard" },
  { id: "vendors", labelKey: "vendors" },
  { id: "products", labelKey: "products" },
  { id: "orders", labelKey: "orders" },
  { id: "customers", labelKey: "customers" },
  { id: "coupons", labelKey: "coupons" },
  { id: "banners", labelKey: "banners" },
  { id: "vendor-reviews", labelKey: "vendor_reviews" },
  { id: "support", labelKey: "help_support" },
  { id: "festival", labelKey: "festival_control" },
  { id: "settings", labelKey: "settings" },
];

type AdminSidebarProps = {
  activeSection?: string;
};

export default function AdminSidebar({ activeSection = "dashboard" }: AdminSidebarProps) {
  const { t } = useLanguage();

  const items = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    [t],
  );

  return (
    <aside className="sticky top-[76px] hidden max-h-[calc(100vh-92px)] w-60 shrink-0 overflow-y-auto rounded-[8px] border border-border-light bg-card shadow-[var(--shadow-sm)] lg:block">
      <div className="border-b border-border-light p-5">
        <div className="text-[16px] font-semibold text-fb-pink">{t("admin_title")}</div>
        <div className="mt-1 text-[12px] text-text-muted">Launch operations</div>
      </div>

      <nav className="py-3">
        {items.map((item) => {
          const active = activeSection === item.id;
          return (
            <Link
              key={item.id}
              href={`/admin#${item.id}`}
              className={`flex h-11 items-center px-4 text-[14px] ${
                active
                  ? "border-l-[3px] border-fb-pink bg-fb-pink-bg font-semibold text-fb-pink"
                  : "text-text-secondary hover:bg-[var(--bg-hover)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
